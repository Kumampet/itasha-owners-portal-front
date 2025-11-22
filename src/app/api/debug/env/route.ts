import { NextResponse } from "next/server";

// GET /api/debug/env
// 環境変数のデバッグ用エンドポイント（本番環境では削除推奨）
export async function GET() {
  const envInfo = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || "not set",
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).sort(),
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

