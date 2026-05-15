import type { NextRequest } from "next/server";

/**
 * EU メンバー国および EEA（アイスランド・リヒテンシュタイン・ノルウェー）の ISO 3166-1 alpha-2。
 * 地域コードは環境により稀に例外があり得ますが、広告運用および GDPR における広い「欧州」ブロック用の基準セットです。
 * 英国は UK GDPR のため関連法域対策として GB を含みます。
 */
const GDPR_BLOCKED_COUNTRY_CODES = new Set<string>([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "GB",
]);

/**
 * 地理ブロックを無効化する条件:
 * - 本番以外（`NODE_ENV !== "production"`）では常に無効（開発・プレビューで利用可能）
 * - `DISABLE_EU_GEOBLOCK=true` のとき無効（ステージング本番相当ビルド向け）
 */
export function isEuGeoBlockDisabled(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env.DISABLE_EU_GEOBLOCK === "true";
}

/**
 * Amplify Hosting / CloudFront がオリジンへ転送することがある視聴者の国コード（ISO 3166-1 alpha-2）。
 * Vercel の x-vercel-ip-country に相当します。
 *
 * （Next の Request でヘッダー名は一律小文字化される実装があります）
 */
function readViewerCountryHeaders(request: NextRequest): string | undefined {
  return (
    request.headers.get("cloudfront-viewer-country") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    undefined
  );
}

/**
 * 本番でもローカルの `next start` は Host が localhost のため国コードヘッダーが付かず、
 * `GEO_BLOCK_UNKNOWN_COUNTRY=true` だと全 API が拒否される。そのためループバックのみ GEO をかけない。
 */
export function shouldSkipGdprGeoBlock(request: NextRequest): boolean {
  if (isEuGeoBlockDisabled()) {
    return true;
  }

  const fromUrl = request.nextUrl.hostname?.trim().toLowerCase();
  const fromForwarded =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()?.split(":")[0]?.toLowerCase() ??
    "";
  const fromHost =
    request.headers.get("host")?.split(":")[0]?.trim().toLowerCase() ?? "";

  const hostCandidates = [
    fromUrl,
    fromForwarded,
    fromHost,
  ].filter(Boolean);

  const localHosts = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "[::1]",
  ]);

  for (const h of hostCandidates) {
    if (localHosts.has(h)) {
      return true;
    }
  }

  return false;
}

export function getRequestCountryCode(request: NextRequest): string | undefined {
  const header =
    readViewerCountryHeaders(request);

  const code = header?.trim().toUpperCase();
  if (!code || code === "XX" || code === "ZZ" || code === "T1") {
    return undefined;
  }
  return code;
}

/**
 * `GEO_BLOCK_UNKNOWN_COUNTRY=true` のとき、国コードが判定できないリクエストもブロックする（より厳格）。
 * 運用するとローカルの `next start` では Host が localhost で困ることがあるので `shouldSkipGdprGeoBlock` と併用する。
 */
function shouldBlockWhenCountryUnknown(): boolean {
  return process.env.GEO_BLOCK_UNKNOWN_COUNTRY === "true";
}

export function shouldBlockGdprRegion(
  countryCode: string | undefined,
): boolean {
  if (countryCode && GDPR_BLOCKED_COUNTRY_CODES.has(countryCode)) {
    return true;
  }
  if (!countryCode && shouldBlockWhenCountryUnknown()) {
    return true;
  }
  return false;
}
