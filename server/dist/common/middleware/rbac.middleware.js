export function requireRole(allowedRoles) {
    return (req, res, next) => {
        const roleCode = req.auth?.roleCode;
        if (!roleCode || !allowedRoles.includes(roleCode)) {
            res.status(403).json({ message: "Insufficient role privileges" });
            return;
        }
        next();
    };
}
