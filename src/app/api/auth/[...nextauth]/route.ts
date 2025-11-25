import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

// AmplifyのEdge Runtimeでは環境変数が正しく読み込まれない場合があるため、
// Node.js Runtimeを明示的に指定する
export const runtime = "nodejs";

// エラーハンドリングを改善
const wrappedHandlers = {
  GET: async (request: NextRequest) => {
    try {
      return await handlers.GET(request);
    } catch (error) {
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
  POST: async (request: NextRequest) => {
    try {
      return await handlers.POST(request);
    } catch (error) {
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
};

export const { GET, POST } = wrappedHandlers;

