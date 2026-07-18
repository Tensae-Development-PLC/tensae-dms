import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

export const queues = {
  email: new Queue("email", { connection: redisConnection, defaultJobOptions }),
  notificationDelivery: new Queue("notification-delivery", { connection: redisConnection, defaultJobOptions }),
  documentExpiryAlerts: new Queue("document-expiry-alerts", { connection: redisConnection, defaultJobOptions }),
  workflowReminders: new Queue("workflow-reminders", { connection: redisConnection, defaultJobOptions }),
  deadLetter: new Queue("dead-letter", { connection: redisConnection, defaultJobOptions: { removeOnComplete: 5000, removeOnFail: 5000 } }),
};
