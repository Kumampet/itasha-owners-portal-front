import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // LP（/）は認証チェックをスキップ
  // イベントページ（/events）は(app)グループ内に移動したため、レイアウトは適用されるが認証は不要
  if (pathname === "/") {
    return NextResponse.next();
  }

  // イベントページは認証不要（未ログインでも閲覧可能）
  if (pathname.startsWith("/events")) {
    return NextResponse.next();
  }

  // 認証が必要なパスでのみauth()を呼び出す
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    // 無効なセッションクッキー（JWEInvalidなど）の場合は無視して続行
    // これはAUTH_SECRETが変更された場合や古いセッションクッキーが残っている場合に発生する
    // NextAuth.js v5では、このエラーは内部で処理されるべきだが、念のため明示的に処理
    session = null;
    
    // デバッグモードでのみエラーをログに記録（本番環境ではログを抑制）
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        const errorMessage = error.message || String(error);
        // JWEInvalidエラーの場合は警告のみ（これは正常な動作）
        if (
          errorMessage.includes("JWEInvalid") ||
          errorMessage.includes("Invalid Compact JWE")
        ) {
          // 無効なセッションクッキーは無視（これは正常な動作）
          // ログは出力しない（ノイズを減らすため）
        } else {
          // その他のエラーはログに記録
          console.error("Auth initialization failed:", error);
        }
      }
    }
  }

  // 認証が必要なパス
  const protectedPaths = [
    "/app/mypage",
    "/app/reminder",
    "/app/groups",
  ];

  // ダッシュボード（/app）は /app/mypage にリダイレクト
  if (pathname === "/app") {
    return NextResponse.redirect(new URL("/app/mypage", request.url));
  }

  // ログインページ（/app/auth）は認証が必要なパスではない（ログイン画面なので）
  const isDashboard = pathname.startsWith("/app/") && pathname !== "/app/auth";

  // 認証が必要なパスにアクセスしている場合
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  ) || isDashboard;

  if (isProtectedPath && !session) {
    // 未ログインの場合はログインページにリダイレクト
    const signInUrl = new URL("/app/auth", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ログイン済みでログインページにアクセスしている場合はマイページにリダイレクト
  if (pathname === "/app/auth" && session) {
    return NextResponse.redirect(new URL("/app/mypage", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

