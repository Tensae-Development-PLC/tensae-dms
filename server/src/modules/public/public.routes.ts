import { Router } from "express";
import { contactRateLimiter } from "../../common/middleware/rate-limit.middleware.js";
import { contactController } from "./controllers/contact.controller.js";

export const publicRoutes = Router();

/**
 * @openapi
 * /api/v1/public/contact:
 *   post:
 *     tags: [Public]
 *     summary: Submit a contact inquiry
 */
publicRoutes.post("/contact", contactRateLimiter, contactController.submit);
