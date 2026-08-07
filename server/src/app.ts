import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttpModule from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { logger } from "./config/logger.js";
import { installBigIntJson } from "./common/utils/bigint-json.js";
import { requestContextMiddleware } from "./common/middleware/request-context.middleware.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import { abuseSlowDown, globalRateLimiter } from "./common/middleware/abuse-protection.middleware.js";
import { ipRulesMiddleware } from "./common/middleware/ip-rules.middleware.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { rbacRoutes } from "./modules/rbac/rbac.routes.js";
import { clientRoutes } from "./modules/client/client.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

installBigIntJson();

export const app = express();
const pinoHttp = pinoHttpModule as unknown as (opts: { logger: typeof logger }) => express.RequestHandler;
app.set("trust proxy", 1);
app.use(helmet());
app.use(globalRateLimiter);
app.use(abuseSlowDown);
app.use(cookieParser());
app.use(
  cors({
    origin: env.CORS_ORIGINS.length === 1 ? env.CORS_ORIGINS[0]! : env.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(pinoHttp({ logger }));
app.use(requestContextMiddleware);
app.use(ipRulesMiddleware);

app.use("/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rbac", rbacRoutes);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorMiddleware);
