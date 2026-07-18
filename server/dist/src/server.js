import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { redisConnection } from "./jobs/queues/connection.js";
import { startWorkers, stopWorkers } from "./jobs/workers/worker-bootstrap.js";
const server = app.listen(env.PORT, () => {
    startWorkers();
    logger.info({ message: "Server running", port: env.PORT });
});
async function shutdown(signal) {
    logger.info({ message: "Shutdown signal received", signal });
    server.close((err) => {
        if (err)
            logger.error({ message: "HTTP server close error", err });
    });
    try {
        await stopWorkers();
    }
    catch (e) {
        logger.error({ message: "Worker shutdown error", error: e instanceof Error ? e.message : e });
    }
    try {
        await redisConnection.quit();
    }
    catch (e) {
        logger.error({ message: "Redis quit error", error: e instanceof Error ? e.message : e });
    }
    try {
        await prisma.$disconnect();
    }
    catch (e) {
        logger.error({ message: "Prisma disconnect error", error: e instanceof Error ? e.message : e });
    }
    process.exit(0);
}
for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
        void shutdown(sig);
    });
}
