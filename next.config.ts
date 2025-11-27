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
  // next-pwaはwebpackを使用するため、Turbopackを無効化
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアント側のwebpack設定
    }
    return config;
  },
  images: {
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
  serverExternalPackages: ["@auth/core"],
};

export default withPWA(nextConfig);
