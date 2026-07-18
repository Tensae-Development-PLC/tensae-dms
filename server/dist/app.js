import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import pino from "pino";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { requestContextMiddleware } from "./common/middleware/request-context.middleware.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { rbacRoutes } from "./modules/rbac/rbac.routes.js";
const logger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
export const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(pinoHttp({ logger }));
app.use(requestContextMiddleware);
app.use("/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rbac", rbacRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorMiddleware);
