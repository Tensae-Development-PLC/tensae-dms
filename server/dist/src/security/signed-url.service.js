import crypto from "node:crypto";
import { env } from "../config/env.js";
export function issueSignedDownloadToken(input, ttlSeconds) {
    const payload = { ...input, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", env.SIGNED_URL_SECRET).update(encoded).digest("base64url");
    return `${encoded}.${signature}`;
}
export function verifySignedDownloadToken(token) {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature)
        return null;
    const expected = crypto.createHmac("sha256", env.SIGNED_URL_SECRET).update(encoded).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
        return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000))
        return null;
    return payload;
}
