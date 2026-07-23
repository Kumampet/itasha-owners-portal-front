import type { NextConfig } from "next";

// next-pwaの型定義がないため、requireを使用
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: false, // 手動登録に変更（PWA環境でもPush通知が動作するように）
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // カスタムService Workerを使用しない（既存のsw.jsを直接使用）
  // next-pwaのworkbox機能は使用せず、既存のsw.jsをそのまま使用
  buildExcludes: [/sw\.js$/],
});

const nextConfig: NextConfig = {
  async rewrites() {
    const defaultRewrites = [];
    
    // リモートDB使用時（ローカル開発時）は、画像の参照先を本番ドメインに向ける
    if (process.env.USE_REMOTE_D1 === "true") {
      defaultRewrites.push({
        source: "/api/images/:path*",
        destination: "https://itasha-owners-navi.link/api/images/:path*",
      });
    }

    return defaultRewrites;
  },
  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
    ];
  },
  // next-pwaはwebpackを使用するため、Turbopackを無効化
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアント側のwebpack設定
    }
    return config;
  },
  images: {
    // 同一オリジンのローカル src にクエリ（キャッシュバスター等）がある場合に必要（Next 16+）
    localPatterns: [
      {
        pathname: "/api/images/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
    ],
  },
  // APIルートをNode.js Runtimeで実行するように強制
  serverExternalPackages: [
    '@auth/core',
    '@prisma/client',
    'prisma',
    "sharp",
    "@panva/hkdf",
    "@opennextjs/cloudflare"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
