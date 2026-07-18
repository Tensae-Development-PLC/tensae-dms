export function tenantBoundaryMiddleware(req, res, next) {
    const tenantId = req.requestContext?.tenantId;
    if (!tenantId) {
        res.status(400).json({ message: "Missing tenant context" });
        return;
    }
    next();
}
