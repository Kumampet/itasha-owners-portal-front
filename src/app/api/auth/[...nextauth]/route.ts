import { handlers } from "@/auth";

// AmplifyのEdge Runtimeでは環境変数が正しく読み込まれない場合があるため、
// Node.js Runtimeを明示的に指定する
export const runtime = "nodejs";

// エラーハンドリングを改善
const wrappedHandlers = {
  GET: async (request: Request) => {
    try {
      return await handlers.GET(request);
    } catch (error) {
      console.error("[Auth Debug] GET handler error:", error);
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
  POST: async (request: Request) => {
    try {
      return await handlers.POST(request);
    } catch (error) {
      console.error("[Auth Debug] POST handler error:", error);
      // エラーを再スローしてNextAuth.jsに処理させる
      throw error;
    }
  },
};

export const { GET, POST } = wrappedHandlers;

