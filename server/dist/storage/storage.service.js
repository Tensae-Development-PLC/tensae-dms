import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
class LocalStorageService {
    async put(key, content) {
        const fullPath = path.join(env.STORAGE_LOCAL_ROOT, key);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
        return fullPath;
    }
}
export const storageService = new LocalStorageService();
