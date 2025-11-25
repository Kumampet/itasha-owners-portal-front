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
  // DATABASE_URLをパースしてmariadb用の設定に変換
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
    const dbRelatedKeys = Object.keys(process.env).filter(key =>
      key.toUpperCase().includes("DATABASE") ||
      key.toUpperCase().includes("DB") ||
      key.toUpperCase().includes("MYSQL") ||
      key.toUpperCase().includes("MARIA")
    );
    const error = new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please configure it in Amplify Console -> App settings -> Environment variables. " +
      `Found ${dbRelatedKeys.length} DB-related env vars: ${dbRelatedKeys.join(", ")}`
    );
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
    // サーバーレス環境での接続リークを防ぐため、接続プールの設定を調整
    const poolConfig = {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || "3306"),
      user: dbUrl.username,
      password: password,
      database: dbUrl.pathname.slice(1), // 先頭の/を削除
      connectionLimit: 5, // 接続数を削減（サーバーレス環境では少ない接続数で運用）
      connectTimeout: 10000, // 10秒（Amplifyのサーバーレス関数のタイムアウトに合わせて短縮）
      acquireTimeout: 10000, // 10秒
      idleTimeout: 60000, // 1分（アイドル接続を早めに解放）
      queueLimit: 0, // 接続待ちキューを無制限（タイムアウトで制御）
    };

    const adapter = new PrismaMariaDb(poolConfig);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });
  } catch (error) {
    throw error;
  }
}

// Prisma Clientを遅延初期化（実際に使用される時点で初期化）
// サーバーレス環境でも接続を共有するため、常にグローバル変数に保存
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
  
  // サーバーレス環境でも接続を共有するため、常にグローバル変数に保存
  // これにより、各リクエストで新しいPrisma Clientインスタンスが作成されるのを防ぐ
  globalForPrisma.prisma = prismaInstance;

  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  },
});


