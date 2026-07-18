export function requireSysAdmin(req, res, next) {
    const payload = req.auth;
    if (!payload || payload.roleCode !== "SYS_ADMIN") {
        res.status(403).json({ message: "Insufficient role privileges" });
        return;
    }
    next();
}
