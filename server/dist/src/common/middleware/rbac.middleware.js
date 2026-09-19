export function requireRole(allowedRoles) {
    return (req, res, next) => {
        const roleCode = req.auth?.roleCode;
        const allowed = new Set(allowedRoles.map((r) => r.toUpperCase()));
        if (!roleCode || !allowed.has(roleCode.toUpperCase())) {
            res.status(403).json({ message: "Insufficient role privileges" });
            return;
        }
        next();
    };
}
