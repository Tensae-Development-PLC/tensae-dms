import { Job, Worker } from "bullmq";
import { logger } from "../../config/logger.js";
import { redisConnection } from "../queues/connection.js";
import { queues } from "../queues/queue-registry.js";
import { sendMail } from "../../common/email/mailer.js";
import { inviteEmailTemplate, passwordResetTemplate } from "../../common/email/templates.js";
import { publicAppBaseUrl } from "../../common/utils/public-urls.js";

type JobHandler = (job: Job) => Promise<void>;

const withDeadLetter = (queueName: string, handler: JobHandler): JobHandler => async (job) => {
  try {
    await handler(job);
  } catch (error) {
    await queues.deadLetter.add("dead", {
      queueName,
      jobName: job.name,
      data: job.data,
      failedReason: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
};

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
  new Worker("notification-delivery", withDeadLetter("notification-delivery", async () => {}), { connection: redisConnection }),
  new Worker("document-expiry-alerts", withDeadLetter("document-expiry-alerts", async () => {}), { connection: redisConnection }),
  new Worker("workflow-reminders", withDeadLetter("workflow-reminders", async () => {}), { connection: redisConnection }),
];

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    logger.error({ message: "Job failed", queue: worker.name, jobId: job?.id, error: error.message });
  });
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}

export function startWorkers(): void {
  logger.info({ message: "BullMQ workers initialized", workers: workers.length });
}
