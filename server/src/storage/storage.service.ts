import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "../config/env.js";

export interface StorageService {
  put(key: string, content: Buffer): Promise<string>;
  getReadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  resolvePath(key: string): string;
}

/** Local VPS disk storage only (Docker volume / bind mount in production). No S3. */
class LocalStorageService implements StorageService {
  async put(key: string, content: Buffer): Promise<string> {
    const fullPath = path.join(env.STORAGE_LOCAL_ROOT, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return fullPath;
  }

  async getReadStream(key: string): Promise<Readable> {
    return fsSync.createReadStream(this.resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolvePath(key));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }
  }

  resolvePath(key: string): string {
    return path.join(env.STORAGE_LOCAL_ROOT, key);
  }
}

export const storageService: StorageService = new LocalStorageService();
