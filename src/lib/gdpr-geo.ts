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
 * Vercel: `x-vercel-ip-country`
 * Cloudflare: `cf-ipcountry`（小文字の cf）
 * 国コードが取れない場合は `undefined`。デフォルトではブロックしません。
 */
export function getRequestCountryCode(request: NextRequest): string | undefined {
  const header =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");

  const code = header?.trim().toUpperCase();
  if (!code || code === "XX" || code === "ZZ" || code === "T1") {
    return undefined;
  }
  return code;
}

/**
 * `GEO_BLOCK_UNKNOWN_COUNTRY=true` のとき、国コードが判定できないリクエストもブロックする（より厳格）。
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
