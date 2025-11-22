// dotenvを常に読み込む（Amplifyでは.envファイルに環境変数を書き出すため）
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv/config");

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Clientの初期化関数
function createPrismaClient() {
  // 環境変数の詳細なデバッグ情報
  const envDebug = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || "not set",
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).sort(),
    dbRelatedKeys: Object.keys(process.env).filter(key =>
      key.toUpperCase().includes("DATABASE") ||
      key.toUpperCase().includes("DB") ||
      key.toUpperCase().includes("MYSQL") ||
      key.toUpperCase().includes("MARIA")
    ),
  };

  console.log("Prisma Client initialization - Environment debug:", envDebug);

  // DATABASE_URLをパースしてmariadb用の設定に変換
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
    const error = new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please configure it in Amplify Console -> App settings -> Environment variables. " +
      `Found ${envDebug.dbRelatedKeys.length} DB-related env vars: ${envDebug.dbRelatedKeys.join(", ")}`
    );
    console.error("Prisma initialization error:", error);
    console.error("Full environment debug:", JSON.stringify(envDebug, null, 2));
    throw error;
  }

  try {
    // mysql:// または mariadb:// の接続文字列をパース
    // URL形式: mysql://user:password@host:port/database
    // databaseUrlは上記のチェックで確実に文字列であることが保証されている
    if (!databaseUrl || typeof databaseUrl !== "string") {
      throw new Error("DATABASE_URL must be a non-empty string");
    }
    // databaseUrlが確実に文字列であることを確認
    const dbUrlString = String(databaseUrl || "").trim();
    if (!dbUrlString) {
      throw new Error("DATABASE_URL is empty after conversion to string");
    }
    // mysql:// を http:// に置換してURLとしてパース
    const normalizedUrl = dbUrlString.replace(/^mysql:\/\//, "http://");
    if (!normalizedUrl || normalizedUrl === "http://") {
      throw new Error("DATABASE_URL is invalid or empty after processing");
    }
    const dbUrl = new URL(normalizedUrl);

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

// Prisma Clientを遅延初期化（実際に使用される時点で初期化）
let prismaInstance: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  prismaInstance = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  },
});


