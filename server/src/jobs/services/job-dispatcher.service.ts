import { createHash } from "node:crypto";
import { queues } from "../queues/queue-registry.js";

function idempotencyJobId(queueName: string, payload: unknown) {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  // BullMQ rejects job ids containing ':' in some environments/platforms.
  // Use a safe separator '__' to keep ids readable and unique.
  return `${queueName}__${digest}`;
}

export const jobDispatcher = {
  enqueueEmail(payload: Record<string, unknown>) {
    return queues.email.add("send", payload, { jobId: idempotencyJobId("email", payload) });
  },
  enqueueNotification(payload: Record<string, unknown>) {
    return queues.notificationDelivery.add("deliver", payload, { jobId: idempotencyJobId("notification", payload) });
  },
  enqueueDocumentExpiryAlert(payload: Record<string, unknown>) {
    return queues.documentExpiryAlerts.add("alert", payload, { jobId: idempotencyJobId("document-expiry", payload) });
  },
  enqueueWorkflowReminder(payload: Record<string, unknown>) {
    return queues.workflowReminders.add("remind", payload, { jobId: idempotencyJobId("workflow-reminder", payload) });
  },
};
