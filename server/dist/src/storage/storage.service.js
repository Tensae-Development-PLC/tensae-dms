import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
/** Local disk storage (production deployment uses a mounted volume / bind mount). */
class LocalStorageService {
    async put(key, content) {
        const fullPath = path.join(env.STORAGE_LOCAL_ROOT, key);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
        return fullPath;
    }
    async getReadStream(key) {
        return fsSync.createReadStream(this.resolvePath(key));
    }
    resolvePath(key) {
        return path.join(env.STORAGE_LOCAL_ROOT, key);
    }
}
export const storageService = new LocalStorageService();
