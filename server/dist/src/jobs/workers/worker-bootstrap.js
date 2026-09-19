import { Worker } from "bullmq";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { redisConnection } from "../queues/connection.js";
import { queues } from "../queues/queue-registry.js";
import { sendMail } from "../../common/email/mailer.js";
import { inviteEmailTemplate, passwordResetTemplate } from "../../common/email/templates.js";
import { publicAppBaseUrl } from "../../common/utils/public-urls.js";
import { storageService } from "../../storage/storage.service.js";
const withDeadLetter = (queueName, handler) => async (job) => {
    try {
        await handler(job);
    }
    catch (error) {
        await queues.deadLetter.add("dead", {
            queueName,
            jobName: job.name,
            data: job.data,
            failedReason: error instanceof Error ? error.message : "unknown",
        });
        throw error;
    }
};
async function runRetentionPurge() {
    const settings = await prisma.tenantSetting.findMany({
        where: { retentionDays: { gt: 0 } },
        select: { tenantId: true, retentionDays: true },
    });
    let deleted = 0;
    for (const setting of settings) {
        const days = setting.retentionDays;
        if (!days || days < 1)
            continue;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const stale = await prisma.document.findMany({
            where: { tenantId: setting.tenantId, createdAt: { lt: cutoff } },
            select: { id: true, storageKey: true, sizeBytes: true },
            take: 200,
        });
        for (const doc of stale) {
            await prisma.$transaction(async (tx) => {
                await tx.favorite.deleteMany({ where: { documentId: doc.id, tenantId: setting.tenantId } });
                await tx.sharedLink.deleteMany({ where: { documentId: doc.id, tenantId: setting.tenantId } });
                await tx.document.deleteMany({ where: { id: doc.id, tenantId: setting.tenantId } });
            });
            await storageService.delete(doc.storageKey);
            const deltaMb = Math.max(1, Math.ceil(Number(doc.sizeBytes) / (1024 * 1024)));
            const quota = await prisma.tenantQuota.findUnique({ where: { tenantId: setting.tenantId } });
            if (quota && quota.storageUsedMb > 0) {
                await prisma.tenantQuota.update({
                    where: { tenantId: setting.tenantId },
                    data: { storageUsedMb: { decrement: Math.min(deltaMb, quota.storageUsedMb) } },
                });
            }
            deleted += 1;
        }
    }
    return { deleted };
}
const workers = [
    new Worker("email", withDeadLetter("email", async (job) => {
        const template = String(job.data?.template ?? "");
        if (template === "password-reset") {
            const resetToken = String(job.data?.resetToken ?? "");
            const email = String(job.data?.email ?? "");
            const resetBase = publicAppBaseUrl();
            const resetUrl = `${resetBase}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
            const mail = passwordResetTemplate({ appName: "DMS", resetUrl });
            await sendMail({ to: email, ...mail });
            return;
        }
        if (template === "team-invite") {
            const email = String(job.data?.email ?? "");
            const companyName = String(job.data?.companyName ?? "your workspace");
            const role = String(job.data?.role ?? "Member");
            const invitedBy = String(job.data?.invitedBy ?? "A team admin");
            const inviteUrl = String(job.data?.inviteUrl ?? `${publicAppBaseUrl()}/invite/accept`);
            const department = typeof job.data?.department === "string" ? job.data.department : undefined;
            const expiryDate = typeof job.data?.expiryDate === "string" ? job.data.expiryDate : undefined;
            const mail = inviteEmailTemplate({ companyName, role, invitedBy, inviteUrl, department, expiryDate });
            await sendMail({ to: email, ...mail });
            return;
        }
        throw new Error(`Unsupported email template: ${template}`);
    }), { connection: redisConnection }),
    new Worker("notification-delivery", withDeadLetter("notification-delivery", async (job) => {
        // Mark notification as delivered/read-ready (in-app list already shows rows).
        const notificationId = typeof job.data?.notificationId === "string" ? job.data.notificationId : null;
        if (notificationId) {
            logger.info({ message: "Notification queued for delivery", notificationId });
        }
    }), { connection: redisConnection }),
    new Worker("document-expiry-alerts", withDeadLetter("document-expiry-alerts", async (job) => {
        if (job.name === "retention-purge" || job.data?.action === "retention-purge") {
            const result = await runRetentionPurge();
            logger.info({ message: "Retention purge completed", deleted: result.deleted });
            return;
        }
    }), { connection: redisConnection }),
    new Worker("workflow-reminders", withDeadLetter("workflow-reminders", async () => { }), { connection: redisConnection }),
];
for (const worker of workers) {
    worker.on("failed", (job, error) => {
        logger.error({ message: "Job failed", queue: worker.name, jobId: job?.id, error: error.message });
    });
}
export async function stopWorkers() {
    await Promise.all(workers.map((w) => w.close()));
}
export function startWorkers() {
    logger.info({ message: "BullMQ workers initialized", workers: workers.length });
    // Daily retention purge (also runs once shortly after boot)
    void queues.documentExpiryAlerts.add("retention-purge", { action: "retention-purge" }, { jobId: "retention-purge-boot", removeOnComplete: true });
    void queues.documentExpiryAlerts.add("retention-purge", { action: "retention-purge" }, {
        repeat: { every: 24 * 60 * 60 * 1000 },
        jobId: "retention-purge-daily",
    });
}
