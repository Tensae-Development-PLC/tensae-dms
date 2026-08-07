import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "../config/env.js";
import { AppError } from "../common/utils/app-error.js";

export interface StorageService {
  put(key: string, content: Buffer): Promise<string>;
  getReadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  resolvePath(key: string): string;
}

function assertSafeStorageKey(key: string): string {
  if (!key || key.includes("\0") || path.isAbsolute(key)) {
    throw new AppError(400, "Invalid storage key");
  }
  const normalized = key.replace(/\\/g, "/");
  if (normalized.split("/").some((part) => part === ".." || part === "")) {
    throw new AppError(400, "Invalid storage key");
  }
  const root = path.resolve(env.STORAGE_LOCAL_ROOT);
  const fullPath = path.resolve(root, normalized);
  const relative = path.relative(root, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError(400, "Invalid storage key");
  }
  return normalized;
}

/** Local VPS disk storage only (Docker volume / bind mount in production). No S3. */
class LocalStorageService implements StorageService {
  async put(key: string, content: Buffer): Promise<string> {
    const safeKey = assertSafeStorageKey(key);
    const fullPath = path.join(env.STORAGE_LOCAL_ROOT, safeKey);
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
    const safeKey = assertSafeStorageKey(key);
    return path.join(env.STORAGE_LOCAL_ROOT, safeKey);
  }
}

export const storageService: StorageService = new LocalStorageService();
