import path from "node:path";

/**
 * 開発時など S3 に一切触れずローカルのみで完結させるフラグ。
 * - unset + NODE_ENV===development → オン（サイトマップは DB、画像はディスク）
 * - "true" / "1" / "yes" → 強制オン
 * - "false" / "0" / "no" → 強制オフ（本番検証でも S3 を試すとき）
 */
export function isLocalBundledStorageEnabled(): boolean {
  const v = process.env.USE_LOCAL_BUNDLED_STORAGE?.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") {
    return true;
  }
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  return process.env.NODE_ENV === "development";
}

/** `local-storage/uploads/...` 相当の既定ルート（.gitignore 対象） */
export function getLocalBundledStorageRoot(): string {
  const override = process.env.LOCAL_STORAGE_ROOT?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.resolve(process.cwd(), "local-storage");
}

/**
 * storageKey は S3 キー相当（例: uploads/images/groupId/foo.jpg）。
 * root 直下に必ず収まるか検証し、ディスクへの絶対パスを返す。
 */
export function resolveLocalBundledStoragePath(storageKey: string): string {
  const normalizedKey = storageKey.replace(/\\/g, "/").replace(/^\//, "");
  if (
    normalizedKey.includes("..") ||
    normalizedKey.includes("//") ||
    !normalizedKey
  ) {
    throw new Error("Invalid storage key");
  }
  const root = path.resolve(getLocalBundledStorageRoot());
  const full = path.resolve(path.join(root, ...normalizedKey.split("/")));
  const rel = path.relative(root, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Storage key escapes local root");
  }
  return full;
}
