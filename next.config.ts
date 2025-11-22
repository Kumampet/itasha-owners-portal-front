import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
  // APIルートをNode.js Runtimeで実行するように強制
  experimental: {
    serverComponentsExternalPackages: ["@auth/core"],
  },
};

export default nextConfig;
