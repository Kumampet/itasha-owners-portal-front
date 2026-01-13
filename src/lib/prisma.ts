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
    // dbUrlStringが確実に文字列であることを確認してからreplaceを呼び出す
    if (typeof dbUrlString !== "string") {
      throw new Error(`DATABASE_URL is not a string after conversion. Type: ${typeof dbUrlString}, Value: ${dbUrlString}`);
    }
    const normalizedUrl = dbUrlString.replace(/^mysql:\/\//, "http://");
    if (!normalizedUrl || normalizedUrl === "http://") {
      throw new Error("DATABASE_URL is invalid or empty after processing");
    }
    const dbUrl = new URL(normalizedUrl);

    // パスワードのデコード（URLエンコードされている場合）
    const password = decodeURIComponent(dbUrl.password || "");

    // PrismaMariaDbはPoolConfigまたは接続文字列を受け取る
    // サーバーレス環境での接続リークを防ぐため、接続プールの設定を調整
    // JWT戦略に変更したことで複数のリクエストが同時に発生する可能性があるため、
    // コネクションプールサイズを増やす（デフォルト: 10）
    // 環境変数で接続プールサイズを制御可能にする
    const connectionLimit = parseInt(process.env.DATABASE_POOL_SIZE || "10", 10);
    
    const poolConfig = {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || "3306"),
      user: dbUrl.username,
      password: password,
      database: dbUrl.pathname.slice(1), // 先頭の/を削除
      connectionLimit, // 環境変数で制御可能（デフォルト: 10）
      connectTimeout: 10000, // 10秒（Amplifyのサーバーレス関数のタイムアウトに合わせて短縮）
      acquireTimeout: 10000, // 10秒
      idleTimeout: 30000, // 30秒（アイドル接続を早めに解放して接続数を削減）
      queueLimit: 0, // 接続待ちキューを無制限（タイムアウトで制御）
      // 接続の再利用を最適化
      reuseConnection: true,
      // 接続の最大生存時間（1時間）
      maxLifetime: 3600000,
    };

    const adapter = new PrismaMariaDb(poolConfig);

    const client = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    // 接続プールの設定をログ出力（初回のみ）
    if (process.env.NODE_ENV === "development" || process.env.DATABASE_DEBUG === "true") {
      console.log(`[Prisma] Connection pool initialized with limit: ${connectionLimit}`);
    }

    return client;
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

  try {
    prismaInstance = createPrismaClient();
    
    // サーバーレス環境でも接続を共有するため、常にグローバル変数に保存
    // これにより、各リクエストで新しいPrisma Clientインスタンスが作成されるのを防ぐ
    globalForPrisma.prisma = prismaInstance;

    return prismaInstance;
  } catch (error) {
    console.error("[Prisma] Failed to initialize Prisma Client:", error);
    if (error instanceof Error) {
      console.error("[Prisma] Error message:", error.message);
      console.error("[Prisma] Error stack:", error.stack);
    }
    throw error;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    try {
      const instance = getPrisma();
      
      if (!instance) {
        throw new Error("Prisma Client instance is null or undefined");
      }
      
      // $disconnectが呼ばれた場合、接続を適切にクローズ
      if (prop === "$disconnect") {
        return async () => {
          try {
            await instance.$disconnect();
            // グローバル変数からも削除
            if (globalForPrisma.prisma === instance) {
              globalForPrisma.prisma = undefined;
            }
            prismaInstance = undefined;
          } catch (error) {
            console.error("[Prisma] Error disconnecting:", error);
            throw error;
          }
        };
      }
      
      const value = instance[prop as keyof PrismaClient];
      
      if (value === undefined && typeof prop === "string" && prop.startsWith("$")) {
        // $で始まるメソッドはundefinedの可能性があるので、そのまま返す
        return value;
      }
      
      if (value === undefined) {
        console.warn(`[Prisma] Property "${String(prop)}" is undefined on Prisma Client instance`);
      }
      
      return value;
    } catch (error) {
      console.error(`[Prisma] Error accessing property "${String(prop)}":`, error);
      throw error;
    }
  },
});

// プロセス終了時の接続クローズは削除
// Edge Runtimeではprocess.onが使用できないため
// Next.jsのサーバーレス環境では接続は自動的に管理されるため、この処理は不要


