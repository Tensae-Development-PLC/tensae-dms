import { adminOverviewService } from "../services/admin-overview.service.js";
export const adminOverviewController = {
    async snapshot(_req, res) {
        res.json(await adminOverviewService.snapshot());
    },
    async storageMetrics(_req, res) {
        res.json(await adminOverviewService.getStorageMetrics());
    },
    async detailedReports(_req, res) {
        res.json(await adminOverviewService.getDetailedReports());
    },
};
