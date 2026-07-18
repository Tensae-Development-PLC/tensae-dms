import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { logger } from "./logger.js";
export const prisma = new PrismaClient({
    log: [{ level: "query", emit: "event" }, "warn", "error"],
});
prisma.$on("query", (event) => {
    if (event.duration >= env.SLOW_QUERY_THRESHOLD_MS) {
        logger.warn({
            message: "Slow query detected",
            durationMs: event.duration,
            query: event.query,
            params: event.params,
        });
    }
});
