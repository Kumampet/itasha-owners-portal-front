/**
 * NextAuth / Auth.js の JWT 復号に使うシークレット（Edge の middleware からも参照可）。
 * Prisma や node:fs に依存しない。
 */

const DEV_FALLBACK_SECRET =
  "local-dev-only-unsafe-nextauth-secret-do-not-use-in-production";

let warnedInsecureSecret = false;

export function getAuthSecret(): string {
  const trimmed = process.env.NEXTAUTH_SECRET?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (process.env.NODE_ENV !== "production") {
    if (!warnedInsecureSecret) {
      warnedInsecureSecret = true;
      console.warn(
        "[NextAuth] NEXTAUTH_SECRET が未設定です。開発用の仮シークレットで起動します。OAuth やセッション用に `.env` へ設定してください: openssl rand -base64 32",
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  const msg =
    "NEXTAUTH_SECRET environment variable is required. " +
    "Please generate a secret key using: openssl rand -base64 32";
  console.error(msg);
  throw new Error(msg);
}

/** `getToken` の `secureCookie`（クッキー名の `__Secure-` 接頭辞） */
export function getUseSecureAuthCookie(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
  return base.startsWith("https:");
}
