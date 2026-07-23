 
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import Database from "better-sqlite3";
import * as schema from "../db/schema";
import * as relations from "../db/relations";
import fs from "node:fs";
import path from "node:path";

function findLocalSqliteFile(): string {
  // 自動的に .wrangler/state/v3/d1 下の .sqlite ファイルを探す
  const d1Dir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    const sqliteFile = files.find(file => file.endsWith(".sqlite") && !file.startsWith("metadata"));
    if (sqliteFile) {
      return path.join(d1Dir, sqliteFile);
    }
  }
  
  // フォールバック
  return path.resolve(process.cwd(), "prisma/dev.db");
}

let dbInstance: any;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // リモートのCloudflare D1にHTTP API経由で直接アクセスする場合
  if (process.env.USE_REMOTE_D1 === "true") {
    console.log("[Drizzle] Using remote Cloudflare D1 via HTTP Proxy.");
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const dbId = process.env.CLOUDFLARE_DATABASE_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !dbId || !token || accountId.includes("YOUR_") || token.includes("YOUR_")) {
      throw new Error("Missing or invalid Cloudflare D1 HTTP API credentials in .env.prod");
    }

    dbInstance = drizzleProxy(
      async (sql, params, method) => {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sql, params }),
          }
        );

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.errors?.[0]?.message || "Failed to query remote D1");
        }

        const result = data.result[0];
        const rows = result.results || [];
        // Drizzleのsqlite-proxyは、オブジェクトの配列ではなく、値の配列の配列（[[val1, val2], ...]）を期待します。
        // （getメソッドの場合は [val1, val2] という単一の配列）
        const rowsAsArrays = rows.map((row: any) => Object.values(row));
        
        if (method === "get") {
          return { rows: rowsAsArrays[0] };
        }
        
        return { rows: rowsAsArrays };
      },
      { schema: { ...schema, ...relations } }
    );
    
    return dbInstance;
  }

  // Cloudflare D1 バインディングの有無を確認
  let d1Database: any = undefined;
  
  // 1. globalThis の Cloudflare コンテキストシンボルから取得
  const contextSymbol = Symbol.for("__cloudflare-context__");
  const cloudflareCtx = (globalThis as any)[contextSymbol];
  if (cloudflareCtx?.env?.DB) {
    d1Database = cloudflareCtx.env.DB;
  }

  // 2. getRequestContext() から取得
  if (!d1Database) {
    try {
      const { getRequestContext } = require("@opennextjs/cloudflare");
      d1Database = getRequestContext()?.env?.DB;
    } catch {}
  }

  // 3. その他一般的なフォールバック
  if (!d1Database) {
    d1Database = (process.env as any).DB || (globalThis as any).DB || (globalThis as any).__cloudflare_env__?.DB;
  }

  if (d1Database) {
    console.log("[Drizzle] Cloudflare D1 binding detected, using drizzle-orm/d1 client.");
    dbInstance = drizzleD1(d1Database, { schema: { ...schema, ...relations } });
  } else {
    // ローカルスクリプト・シード実行時など (better-sqlite3)
    const sqlitePath = findLocalSqliteFile();
    console.log(`[Drizzle] Cloudflare D1 binding not found, falling back to better-sqlite3 with: ${sqlitePath}`);
    const client = new Database(sqlitePath);
    dbInstance = drizzleSqlite(client, { schema: { ...schema, ...relations } });
  }

  return dbInstance;
}

// 遅延初期化を Proxy でラップして公開
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
