import { NextResponse } from "next/server";

// GET /api/debug/env
// 環境変数のデバッグ用エンドポイント（本番環境では削除推奨）
export async function GET() {
  let contextInfo: any = {};
  try {
    const { getRequestContext } = require("@opennextjs/cloudflare");
    const ctx = getRequestContext();
    contextInfo = {
      hasCtx: !!ctx,
      keys: ctx ? Object.keys(ctx) : [],
      envKeys: ctx?.env ? Object.keys(ctx.env) : [],
      dbType: ctx?.env?.DB ? typeof ctx.env.DB : "undefined",
    };
  } catch (e: any) {
    contextInfo = { error: e.message };
  }

  const envInfo = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || "not set",
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).sort(),
    contextInfo,
    globalThisKeys: Object.keys(globalThis).filter(k => k.includes("DB") || k.includes("env") || k.includes("context")),
    dbRelatedKeys: Object.keys(process.env)
      .filter(key => 
        key.toUpperCase().includes("DATABASE") || 
        key.toUpperCase().includes("DB") || 
        key.toUpperCase().includes("MYSQL") ||
        key.toUpperCase().includes("MARIA")
      )
      .map(key => ({
        key,
        hasValue: !!process.env[key],
        valueLength: process.env[key]?.length || 0,
        valuePrefix: process.env[key]?.substring(0, 20) || "not set",
      })),
  };

  return NextResponse.json(envInfo, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

