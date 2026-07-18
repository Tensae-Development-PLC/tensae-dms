import { rbacService } from "../services/rbac.service.js";
export const rbacController = {
    async listRoles(req, res) {
        const tenantId = req.requestContext?.tenantId;
        if (!tenantId) {
            res.status(400).json({ message: "Missing tenant context" });
            return;
        }
        const roles = await rbacService.listRoles(tenantId);
        res.status(200).json(roles);
    },
};
