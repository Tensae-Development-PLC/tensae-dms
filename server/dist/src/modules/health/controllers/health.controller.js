import { setTimeout as delay } from "node:timers/promises";
import { prisma } from "../../../config/prisma.js";
import { redisConnection } from "../../../jobs/queues/connection.js";
async function checkWithTimeout(fn, ms) {
    try {
        await Promise.race([fn(), delay(ms).then(() => Promise.reject(new Error("timeout")))]);
        return "ok";
    }
    catch {
        return "error";
    }
}
export const healthController = {
    async check(_req, res) {
        const checks = { api: "ok" };
        checks.postgresql = await checkWithTimeout(() => prisma.$queryRaw `SELECT 1`, 2_000);
        checks.redis = await checkWithTimeout(() => redisConnection.ping(), 2_000);
        const ok = checks.postgresql === "ok" && checks.redis === "ok";
        res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", checks });
    },
};
