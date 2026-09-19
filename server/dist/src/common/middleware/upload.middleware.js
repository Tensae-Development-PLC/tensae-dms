import multer from "multer";
export const uploadDocumentMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});
