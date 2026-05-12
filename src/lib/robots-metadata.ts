import type { Metadata } from "next";

const ADSENSE_PUBLISHER_ID = "ca-pub-5239358801885177";

const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-GM4ZG74JH1";

/** `/admin` 管理画面は常に検索インデックス対象外 */
export function getAdminRobotsMetadata(): Metadata["robots"] {
  return {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  };
}

/**
 * 本番で検索・広告クローラに公開ページを評価させるための robots 設定。
 * プレビュー／ステージングでインデックスを避ける場合は
 * 環境変数 NEXT_PUBLIC_PREVENT_INDEXING=true を設定する。
 */
export function getDefaultRobotsMetadata(): Metadata["robots"] {
  if (process.env.NEXT_PUBLIC_PREVENT_INDEXING === "true") {
    return {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    };
  }
  return {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  };
}

export function isAdsenseScriptEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PREVENT_INDEXING !== "true";
}

export function getAdsenseClientId(): string {
  return ADSENSE_PUBLISHER_ID;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_PREVENT_INDEXING !== "true" &&
    process.env.NEXT_PUBLIC_DISABLE_GOOGLE_ANALYTICS !== "true"
  );
}

/**
 * `.env` の `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` が空で上書きされていれば無効。
 * 未設定のときはコード上の既定 ID（運用用）を使います。
 */
export function getGoogleMeasurementId(): string | null {
  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID;
  if (fromEnv !== undefined) {
    const trimmed = fromEnv.trim();
    if (trimmed === "") {
      return null;
    }
    return trimmed;
  }
  return GOOGLE_ANALYTICS_MEASUREMENT_ID;
}
