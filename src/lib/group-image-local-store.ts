 
// import fs from "node:fs/promises";
import path from "node:path";
import {
  resolveLocalBundledStoragePath,
  isLocalBundledStorageEnabled,
} from "@/lib/local-storage-mode";

export function isGroupImageStorageLocal(): boolean {
  return isLocalBundledStorageEnabled();
}

export async function writeLocalGroupImage(
  storageKey: string,
  body: Buffer,
): Promise<void> {
  const full = resolveLocalBundledStoragePath(storageKey);
  // await fs.mkdir(path.dirname(full), { recursive: true });
  // await fs.writeFile(full, body);
}

export type LocalGroupImageStat = {
  buffer: Buffer;
  mtime: Date;
  size: number;
};

export async function readLocalGroupImage(
  storageKey: string,
): Promise<LocalGroupImageStat | null> {
  const full = resolveLocalBundledStoragePath(storageKey);
  try {
    return null;
    // const [stat, buffer] = await Promise.all([fs.stat(full), fs.readFile(full)]);
    // const [stat, buffer] = await Promise.all([fs.stat(full), fs.readFile(full)]);
    // return { buffer, mtime: stat.mtime, size: stat.size };
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw e;
  }
}

/**
 * uploads/images/${groupId}/ 配下をすべて削除する（S3 prefix 削除と同じ意味）
 */
export async function deleteLocalGroupImagesByGroupId(
  groupId: string,
): Promise<void> {
  const marker = resolveLocalBundledStoragePath(`uploads/images/${groupId}/_.keep`);
  const dir = path.dirname(marker);
  // await fs.rm(dir, { recursive: true, force: true });
}

/** uploads/images/events/${eventId}/ 配下を削除（イベントサムネは1枚のみのためディレクトリごと削除） */
export async function deleteLocalEventImagesByEventId(
  eventId: string,
): Promise<void> {
  const marker = resolveLocalBundledStoragePath(
    `uploads/images/events/${eventId}/_.keep`,
  );
  const dir = path.dirname(marker);
  // await fs.rm(dir, { recursive: true, force: true });
}
