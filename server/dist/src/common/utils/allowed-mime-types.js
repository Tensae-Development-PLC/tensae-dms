/** Broad allowlist for company document uploads (100MB max enforced separately). */
const ALLOWED_MIME_TYPES = new Set([
    // Documents
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/html",
    "text/markdown",
    "application/json",
    "application/xml",
    "text/xml",
    "application/rtf",
    // Microsoft Office
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // OpenDocument
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    // Images
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/x-icon",
    // Audio / video
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/mp4",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/gzip",
    "application/x-7z-compressed",
    // Generic binary fallback (some browsers send this)
    "application/octet-stream",
]);
const BLOCKED_EXTENSIONS = new Set([
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".msi",
    ".scr",
    ".ps1",
    ".vbs",
    ".js",
    ".jar",
    ".dll",
    ".sh",
]);
export function isAllowedUpload(mimeType, filename) {
    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")).toLowerCase() : "";
    if (ext && BLOCKED_EXTENSIONS.has(ext))
        return false;
    if (ALLOWED_MIME_TYPES.has(mimeType))
        return true;
    // Allow any image/*, audio/*, video/*, text/*
    if (/^(image|audio|video|text)\//.test(mimeType))
        return true;
    return false;
}
export { ALLOWED_MIME_TYPES };
