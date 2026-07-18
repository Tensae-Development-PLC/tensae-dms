import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { logger } from "../../config/logger.js";
export function errorMiddleware(err, req, res, _next) {
    logger.error({
        message: "Request failed",
        requestId: req.requestContext?.requestId,
        path: req.path,
        error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof ZodError) {
        res.status(400).json({
            message: "Validation failed",
            issues: err.issues,
            requestId: req.requestContext?.requestId,
        });
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            requestId: req.requestContext?.requestId,
        });
        return;
    }
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({
        message,
        requestId: req.requestContext?.requestId,
    });
}
