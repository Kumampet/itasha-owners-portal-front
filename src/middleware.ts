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
    // /app配下のパスにアクセスする場合のみauth()を呼び出す
    if (pathname.startsWith("/app/")) {
      session = await auth();
      // デバッグ: セッション取得状況をログに出力（/app配下の全パス）
      console.log("[Middleware Debug] Session check for", pathname, ":", session ? `取得成功 (user: ${session.user?.email || "unknown"})` : "未取得");
      if (session) {
        console.log("[Middleware Debug] Session details:", {
          userId: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
        });
      }
    }
  } catch (error) {
    // 無効なセッションクッキー（JWEInvalidなど）の場合は無視して続行
    // これはNEXTAUTH_SECRETが変更された場合や古いセッションクッキーが残っている場合に発生する
    // NextAuth.js v5では、このエラーは内部で処理されるべきだが、念のため明示的に処理
    session = null;

    // エラーをログに記録（本番環境でもデバッグのため）
    if (error instanceof Error) {
      const errorMessage = error.message || String(error);
      // JWEInvalidエラーの場合は警告のみ（これは正常な動作）
      if (
        errorMessage.includes("JWEInvalid") ||
        errorMessage.includes("Invalid Compact JWE") ||
        errorMessage.includes("JWTSessionError")
      ) {
        // 無効なセッションクッキーは無視（これは正常な動作）
        // デバッグのため、本番環境でもログを出力
        console.warn("[Middleware Debug] Invalid session cookie detected for", pathname, ":", errorMessage);
      } else {
        // その他のエラーはログに記録
        console.error("[Middleware Debug] Auth initialization failed for", pathname, ":", error);
        if (error.stack) {
          console.error("[Middleware Debug] Error stack:", error.stack);
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

  // セッションが取得できなかった場合でも、クライアントサイドのuseSessionに任せる
  // データベースセッションを使用する場合、middleware.ts（Edge Runtime）ではセッションが取得できない可能性がある
  // その場合、クライアントサイドでセッションを確認し、必要に応じてリダイレクトする
  if (isProtectedPath && !session) {
    // セッション取得に失敗した場合のログ
    console.warn("[Middleware Debug] Session not found for protected path:", pathname);
    console.warn("[Middleware Debug] This may be due to Edge Runtime limitations with database sessions");
    console.warn("[Middleware Debug] Client-side session check will be performed instead");

    // クライアントサイドのuseSessionに任せるため、リダイレクトしない
    // ただし、明らかに未ログインの場合はリダイレクトする
    // セッションクッキーが存在しない場合は、未ログインと判断
    const sessionCookie = request.cookies.get("__Secure-authjs.session-token");
    const jwtCookie = request.cookies.get("__Secure-authjs.pkce.code_verifier");

    if (!sessionCookie && !jwtCookie) {
      // セッションクッキーが存在しない場合は、未ログインと判断してリダイレクト
      const signInUrl = new URL("/app/auth", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // セッションクッキーが存在する場合は、クライアントサイドでセッションを確認させる
    // データベースセッションを使用する場合、middleware.tsではセッションが取得できない可能性がある
  }

  // ログイン済みでログインページにアクセスしている場合
  if (pathname === "/app/auth" && session) {
    // callbackUrlパラメータが指定されている場合はそのURLにリダイレクト
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      try {
        // callbackUrlが相対パスの場合
        if (callbackUrl.startsWith("/")) {
          return NextResponse.redirect(new URL(callbackUrl, request.url));
        }
        // callbackUrlが完全なURLの場合、同じオリジンのみ許可
        const callbackUrlObj = new URL(callbackUrl);
        if (callbackUrlObj.origin === new URL(request.url).origin) {
          return NextResponse.redirect(callbackUrlObj);
        }
      } catch {
        // URLのパースに失敗した場合はデフォルトのマイページにリダイレクト
      }
    }
    // callbackUrlが指定されていない場合はマイページにリダイレクト
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

