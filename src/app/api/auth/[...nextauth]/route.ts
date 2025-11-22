import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

// AmplifyのEdge Runtimeでは環境変数が正しく読み込まれない場合があるため、
// Node.js Runtimeを明示的に指定する
export const runtime = "nodejs";

// 環境変数の読み込みを確認（デバッグ用）
if (typeof process !== "undefined" && process.env) {
  console.log("[Auth Debug] Route.ts - NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? `設定済み（長さ: ${process.env.NEXTAUTH_SECRET.length}文字）` : "未設定");
  console.log("[Auth Debug] Route.ts - Runtime:", runtime);
}

// エラーハンドリングを改善
const wrappedHandlers = {
  GET: async (request: NextRequest) => {
    try {
      return await handlers.GET(request);
    } catch (error) {
      console.error("[Auth Debug] GET handler error:", error);
      if (error instanceof Error) {
        console.error("[Auth Debug] Error message:", error.message);
        console.error("[Auth Debug] Error stack:", error.stack);
        // Invalid Compact JWEエラーの場合は、セッションクッキーをクリアする必要がある
        if (error.message.includes("Invalid Compact JWE") || error.message.includes("JWEInvalid")) {
          console.warn("[Auth Debug] Invalid session cookie detected, this may be due to NEXTAUTH_SECRET mismatch");
        }
      }
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
  POST: async (request: NextRequest) => {
    try {
      return await handlers.POST(request);
    } catch (error) {
      console.error("[Auth Debug] POST handler error:", error);
      if (error instanceof Error) {
        console.error("[Auth Debug] Error message:", error.message);
        console.error("[Auth Debug] Error stack:", error.stack);
        // Invalid Compact JWEエラーの場合は、セッションクッキーをクリアする必要がある
        if (error.message.includes("Invalid Compact JWE") || error.message.includes("JWEInvalid")) {
          console.warn("[Auth Debug] Invalid session cookie detected, this may be due to NEXTAUTH_SECRET mismatch");
        }
      }
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
};

export const { GET, POST } = wrappedHandlers;

