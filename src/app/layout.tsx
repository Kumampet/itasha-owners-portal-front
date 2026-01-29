import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { EnvironmentRibbon } from "@/components/environment-ribbon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "痛車オーナーズナビ | いたなび！",
  description:
    "痛車イベントの予定管理・団体参加（併せ）管理に特化した、モバイルファーストの情報プラットフォーム",
  metadataBase:
    typeof window === "undefined"
      ? new URL("https://example.com")
      : new URL(window.location.origin),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "痛車オーナーズナビ | いたなび！",
    description:
      "痛車イベントのエントリー開始・支払期限・併せ連絡をまとめて管理できるPWA",
    type: "website",
  },
  manifest: "/manifest.json",
  themeColor: "#18181b",
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
    "google-adsense-account": "ca-pub-5239358801885177",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // SafeArea対応のため
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
