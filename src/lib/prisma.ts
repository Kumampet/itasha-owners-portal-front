import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createPool } from "mariadb";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URLをパースしてmariadb用の設定に変換
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

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

const adapter = new PrismaMariaDb(poolConfig);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


