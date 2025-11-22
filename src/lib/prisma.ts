// dotenvは開発環境でのみ使用（本番環境では環境変数が直接設定される）
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv/config");
}

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Clientの初期化関数
function createPrismaClient() {
  // DATABASE_URLをパースしてmariadb用の設定に変換
  if (!process.env.DATABASE_URL) {
    const error = new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please configure it in Amplify Console -> App settings -> Environment variables"
    );
    console.error("Prisma initialization error:", error);
    console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes("DATABASE") || key.includes("DB")));
    throw error;
  }

  try {
    // mysql:// または mariadb:// の接続文字列をパース
    // URL形式: mysql://user:password@host:port/database
    const dbUrlString = process.env.DATABASE_URL.replace(/^mysql:\/\//, "http://");
    const dbUrl = new URL(dbUrlString);

    // パスワードのデコード（URLエンコードされている場合）
    const password = decodeURIComponent(dbUrl.password || "");

    // PrismaMariaDbはPoolConfigまたは接続文字列を受け取る
    const poolConfig = {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || "3306"),
      user: dbUrl.username,
      password: password,
      database: dbUrl.pathname.slice(1), // 先頭の/を削除
      connectionLimit: 10,
      connectTimeout: 60000, // 60秒に延長
      acquireTimeout: 60000, // 60秒に延長
      idleTimeout: 300000, // 5分
    };

    console.log("Initializing Prisma Client with config:", {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
    });

    const adapter = new PrismaMariaDb(poolConfig);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });
  } catch (error) {
    console.error("Failed to create Prisma Client:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


