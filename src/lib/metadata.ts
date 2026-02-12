import type { Metadata } from "next";

// metadataBaseを環境変数から取得（OGP画像の絶対URL生成に必要）
export function getMetadataBase(): URL {
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (authUrl) {
    return new URL(authUrl);
  }
  // 環境変数が設定されていない場合はデフォルト値を使用
  // 本番環境では必ず環境変数を設定すること
  return new URL("https://example.com");
}

// デフォルトのOGP画像URL
const DEFAULT_OG_IMAGE = "/images/main_logo_square.png";

// デフォルトの説明文
const DEFAULT_DESCRIPTION =
  "痛車イベントの予定管理・団体参加（併せ）管理に特化した、モバイルファーストの情報プラットフォーム";

type CreateMetadataOptions = {
  title: string;
  description?: string;
  imageUrl?: string | null;
  type?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
};

/**
 * 管理画面以外のページ用のOGP画像付きメタデータを生成する
 */
export function createMetadataWithOGP({
  title,
  description,
  imageUrl,
  type = "website",
  twitterCard = "summary",
}: CreateMetadataOptions): Metadata {
  // OGP画像のURLを設定（指定されたimageUrlがある場合はそれを使用、ない場合はデフォルト画像）
  const ogImageUrl = imageUrl || DEFAULT_OG_IMAGE;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const fullTitle = title.includes("|") ? title : `${title} | 痛車オーナーズナビ | いたなび！`;

  // Twitterカードの画像サイズを設定（summary_large_imageの場合は1200x630、summaryの場合は1200x1200）
  const twitterImageWidth = twitterCard === "summary_large_image" ? 1200 : 1200;
  const twitterImageHeight = twitterCard === "summary_large_image" ? 630 : 1200;

  return {
    title: fullTitle,
    description: finalDescription,
    metadataBase: getMetadataBase(),
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      type,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description: finalDescription,
      images: [
        {
          url: ogImageUrl,
          width: twitterImageWidth,
          height: twitterImageHeight,
          alt: title,
        },
      ],
    },
  };
}
