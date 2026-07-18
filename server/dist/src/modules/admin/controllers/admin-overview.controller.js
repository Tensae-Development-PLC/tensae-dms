import { adminOverviewService } from "../services/admin-overview.service.js";
export const adminOverviewController = {
    async snapshot(_req, res) {
        res.json(await adminOverviewService.snapshot());
    },
};
