import { prisma } from "../../config/prisma.js";
import { verifySignedDownloadToken } from "../../security/signed-url.service.js";
export async function fileAccessMiddleware(req, res, next) {
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
    const signedToken = typeof req.query.token === "string" ? req.query.token : undefined;
    if (signedToken) {
        const payload = verifySignedDownloadToken(signedToken);
        if (!payload || payload.documentId !== documentId) {
            res.status(403).json({ message: "Invalid signed download token" });
            return;
        }
        req.requestContext = { ...(req.requestContext ?? { requestId: "unknown" }), tenantId: payload.tenantId, userId: payload.userId };
        next();
        return;
    }
    const userId = req.requestContext?.userId;
    const tenantId = req.requestContext?.tenantId;
    if (!userId || !tenantId) {
        res.status(401).json({ message: "Unauthorized document access" });
        return;
    }
    const document = await prisma.document.findFirst({ where: { id: documentId, tenantId } });
    if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
    }
    next();
}
