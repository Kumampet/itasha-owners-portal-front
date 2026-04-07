import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { EnvironmentRibbon } from "@/components/environment-ribbon";
import { createMetadataWithOGP } from "@/lib/metadata";
import {
  getAdsenseClientId,
  getDefaultRobotsMetadata,
  isAdsenseScriptEnabled,
} from "@/lib/robots-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// OGP関連のメタデータを共通関数から取得
const ogpMetadata = createMetadataWithOGP({
  title: "痛車オーナーズナビ | いたなび！",
  description:
    "痛車イベントの予定管理・団体参加（併せ）管理に特化した、モバイルファーストの情報プラットフォーム",
});

export const metadata: Metadata = {
  ...ogpMetadata,
  robots: getDefaultRobotsMetadata(),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "痛車オーナーズナビ | いたなび！",
  },
  icons: {
    apple: "/images/main_logo_square.png",
    icon: "/images/main_logo_square.png",
  },
  other: {
    "google-adsense-account": getAdsenseClientId(),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // SafeArea対応のため
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Googleフォント10種類を読み込む（WYSIWYGエディタ用） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Pacifico&family=Bebas+Neue&family=Dancing+Script:wght@400;700&family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {isAdsenseScriptEnabled() ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${getAdsenseClientId()}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <EnvironmentRibbon />
        </Providers>
      </body>
    </html>
  );
}
