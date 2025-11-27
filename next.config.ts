import type { NextConfig } from "next";

// next-pwaの型定義がないため、requireを使用
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // カスタムService Workerを使用（既存のPush通知機能を含む）
  // 既存のsw.jsはworkboxと統合される
  sw: "sw.js",
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
