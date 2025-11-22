import { handlers } from "@/auth";

// AmplifyのEdge Runtimeでは環境変数が正しく読み込まれない場合があるため、
// Node.js Runtimeを明示的に指定する
export const runtime = "nodejs";

export const { GET, POST } = handlers;

