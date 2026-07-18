import type { Request, Response } from "express";
import { adminOverviewService } from "../services/admin-overview.service.js";

export const adminOverviewController = {
  async snapshot(_req: Request, res: Response) {
    res.json(await adminOverviewService.snapshot());
  },
  async storageMetrics(_req: Request, res: Response) {
    res.json(await adminOverviewService.getStorageMetrics());
  },
  async detailedReports(_req: Request, res: Response) {
    res.json(await adminOverviewService.getDetailedReports());
  },
};
