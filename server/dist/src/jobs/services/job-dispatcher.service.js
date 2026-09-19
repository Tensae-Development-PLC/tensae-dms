import { createHash } from "node:crypto";
import { queues } from "../queues/queue-registry.js";
function idempotencyJobId(queueName, payload) {
    const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    // BullMQ rejects job ids containing ':' in some environments/platforms.
    // Use a safe separator '__' to keep ids readable and unique.
    return `${queueName}__${digest}`;
}
export const jobDispatcher = {
    enqueueEmail(payload) {
        return queues.email.add("send", payload, { jobId: idempotencyJobId("email", payload) });
    },
    enqueueNotification(payload) {
        return queues.notificationDelivery.add("deliver", payload, { jobId: idempotencyJobId("notification", payload) });
    },
    enqueueDocumentExpiryAlert(payload) {
        return queues.documentExpiryAlerts.add("alert", payload, { jobId: idempotencyJobId("document-expiry", payload) });
    },
    enqueueWorkflowReminder(payload) {
        return queues.workflowReminders.add("remind", payload, { jobId: idempotencyJobId("workflow-reminder", payload) });
    },
};
