import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "../config/env.js";

export interface StorageService {
  put(key: string, content: Buffer): Promise<string>;
  getReadStream(key: string): Promise<Readable>;
  resolvePath(key: string): string;
}

/** Local disk storage (production deployment uses a mounted volume / bind mount). */
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

  resolvePath(key: string): string {
    return path.join(env.STORAGE_LOCAL_ROOT, key);
  }
}

export const storageService: StorageService = new LocalStorageService();
