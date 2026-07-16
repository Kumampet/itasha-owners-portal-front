import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { PrismaClient as PrismaClientMySQL } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient as PrismaClientSQLite } from "prisma-sqlite/edge";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Next.js が環境変数を注入する前に `@/lib/prisma` のみ単体評価された場合への補填。
 * `.env.local` が `.env` より後勝ちになるよう順に適用する（Amplify で DATABASE_URL が既にあるときは NOOP）。
 * 本番用 `.env.prod` はここでは読み込まない（`dotenv -e .env.prod --` で起動する想定）。
 */
function ensureDotenvFallbackWhenDatabaseMissing(): void {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }
  const cwd = process.cwd();
  const chain = [
    resolve(cwd, ".env"),
    resolve(cwd, ".env.development"),
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env.development.local"),
  ];
  for (const path of chain) {
    if (!existsSync(path)) continue;
    dotenv.config({ path, override: true });
  }
}

ensureDotenvFallbackWhenDatabaseMissing();

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

// Prisma Client(MySQL)の初期化関数
function createMySQLPrismaClient(): PrismaClientMySQL {
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
    const dbUrlString = String(databaseUrl || "").trim();
    const normalizedUrl = dbUrlString
      .replace(/^mariadb:\/\//, "http://")
      .replace(/^mysql:\/\//, "http://");
    const dbUrl = new URL(normalizedUrl);
    const password = decodeURIComponent(dbUrl.password || "");

    const connectionLimit = parseInt(process.env.DATABASE_POOL_SIZE || "10", 10);
    const isDev = process.env.NODE_ENV === "development";
    const defaultConnectMs = isDev ? 60000 : 10000;
    const defaultAcquireMs = isDev ? 60000 : 10000;
    const connectTimeout = parseInt(
      process.env.DATABASE_CONNECT_TIMEOUT_MS || String(defaultConnectMs),
      10,
    );
    const acquireTimeout = parseInt(
      process.env.DATABASE_ACQUIRE_TIMEOUT_MS || String(defaultAcquireMs),
      10,
    );

    const host = dbUrl.hostname;
    const useSslExplicitOff =
      process.env.DATABASE_SSL_OFF?.trim().toLowerCase() === "true";
    const useLoopbackSslOff =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1";
    const useComposeServiceSslOff =
      isDev && (host === "mysql" || host === "mariadb" || host === "db");
    const sslDisabled =
      useSslExplicitOff || useLoopbackSslOff || useComposeServiceSslOff;

    const allowPublicKeyRetrievalExplicit =
      process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL?.trim().toLowerCase() ===
      "true";
    const allowPublicKeyRetrievalDefaultLocalDev =
      isDev &&
      sslDisabled &&
      (host === "localhost" || host === "127.0.0.1");

    const denyPublicKey = process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === "false";
    const allowPublicKeyRetrieval =
      !denyPublicKey &&
      (allowPublicKeyRetrievalExplicit || allowPublicKeyRetrievalDefaultLocalDev);

    const poolConfig = {
      host,
      port: parseInt(dbUrl.port || "3306"),
      user: dbUrl.username,
      password: password,
      database: dbUrl.pathname.slice(1),
      connectionLimit,
      connectTimeout,
      acquireTimeout,
      idleTimeout: 30000,
      queueLimit: 0,
      reuseConnection: true,
      maxLifetime: 3600000,
      ...(sslDisabled ? { ssl: false as const } : {}),
      ...(allowPublicKeyRetrieval ? { allowPublicKeyRetrieval: true as const } : {}),
    };

    const adapter = new PrismaMariaDb(poolConfig);
    const client = new PrismaClientMySQL({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    if (process.env.NODE_ENV === "development" || process.env.DATABASE_DEBUG === "true") {
      console.log(`[Prisma] Connection pool initialized with limit: ${connectionLimit}`);
    }

    return client;
  } catch (error) {
    throw error;
  }
}

function createMockPrismaClient(): any {
  const modelProxy = new Proxy({}, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return undefined;
      }
      return async (...args: any[]) => {
        console.log(`[Mock Prisma] Intercepted model method: ${String(prop)}`, args);
        if (prop === "findMany") {
          return [];
        }
        if (prop === "findUnique" || prop === "findFirst") {
          return null;
        }
        if (prop === "count") {
          return 0;
        }
        if (prop === "create" || prop === "update" || prop === "upsert" || prop === "delete") {
          return {};
        }
        return null;
      };
    }
  });

  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return undefined;
      }
      if (typeof prop === "string" && prop.startsWith("$")) {
        if (prop === "$transaction") {
          return async (arg: any) => {
            if (typeof arg === "function") {
              return arg(createMockPrismaClient());
            }
            if (Array.isArray(arg)) {
              return Promise.all(arg);
            }
            return arg;
          };
        }
        return async (...args: any[]) => {
          console.log(`[Mock Prisma] Intercepted client method: ${String(prop)}`, args);
          return null;
        };
      }
      return modelProxy;
    }
  }) as unknown as any;
}

// Prisma Clientを遅延初期化
let prismaInstance: any | undefined;

function getPrisma(): any {
  if (process.env.MOCK_DATABASE === "true") {
    if (!prismaInstance) {
      console.log("[Prisma] MOCK_DATABASE is true, initializing mock Prisma client.");
      prismaInstance = createMockPrismaClient();
    }
    return prismaInstance;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  try {
    // Cloudflare D1 バインディングの取得を試みる
    let d1Database: any = undefined;

    // 1. globalThis の Cloudflare コンテキストシンボルから直接取得
    const contextSymbol = Symbol.for("__cloudflare-context__");
    const cloudflareCtx = (globalThis as any)[contextSymbol];
    if (cloudflareCtx?.env?.DB) {
      d1Database = cloudflareCtx.env.DB;
    }

    // 2. getRequestContext() をフォールバックとして使用
    if (!d1Database) {
      try {
        const { getRequestContext } = require("@opennextjs/cloudflare");
        d1Database = getRequestContext()?.env?.DB;
      } catch {
        // getRequestContext がない環境（ビルド時等）は無視
      }
    }

    // 3. 一般的な環境変数やグローバル変数からのフォールバック
    if (!d1Database) {
      d1Database = (process.env as any).DB || (globalThis as any).DB || (globalThis as any).__cloudflare_env__?.DB;
    }

    if (d1Database) {
      console.log("[Prisma] Cloudflare D1 binding detected, initializing SQLite Prisma Client with PrismaD1 adapter.");
      const adapter = new PrismaD1(d1Database);
      prismaInstance = new PrismaClientSQLite({
        adapter,
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
      });
    } else {
      // Edge Runtime(Wrangler/OpenNext環境)でMySQLクライアントがエイリアス(空)になっているか判定
      const isMySQLMockedOrMissing =
        typeof PrismaClientMySQL !== "function" ||
        !PrismaClientMySQL.prototype ||
        PrismaClientMySQL.name === "Object";

      if (isMySQLMockedOrMissing) {
        console.warn("[Prisma] Edge Runtime detected but D1 binding is not yet available (likely module load phase). Returning mock client temporarily.");
        return createMockPrismaClient();
      }

      console.log("[Prisma] Cloudflare D1 binding not detected, falling back to MySQL Client.");
      prismaInstance = createMySQLPrismaClient();
    }
    
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


