import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル（manifest.json、アイコンファイルなど）は早期リターン
  if (
    pathname === "/manifest.json" ||
    pathname.startsWith("/icon-") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // LP（/）は認証チェックをスキップ
  // イベントページ（/events）は(app)グループ内に移動したため、レイアウトは適用されるが認証は不要
  if (pathname === "/") {
    return NextResponse.next();
  }

  // イベントページは認証不要（未ログインでも閲覧可能）
  if (pathname.startsWith("/events")) {
    return NextResponse.next();
  }

  // イベント掲載依頼フォームとお問い合わせフォームは認証不要（未ログインでもアクセス可能）
  if (pathname === "/app/event-submission" || pathname === "/app/contact") {
    return NextResponse.next();
  }

  // 認証が必要なパスでのみauth()を呼び出す
  let session = null;
  try {
    // /app配下または/admin配下のパスにアクセスする場合にauth()を呼び出す
    if (pathname.startsWith("/app/") || pathname.startsWith("/admin")) {
      session = await auth();
    }
  } catch {
    // 無効なセッションクッキー（JWEInvalidなど）の場合は無視して続行
    // これはNEXTAUTH_SECRETが変更された場合や古いセッションクッキーが残っている場合に発生する
    // NextAuth.js v5では、このエラーは内部で処理されるべきだが、念のため明示的に処理
    session = null;

    // エラーは無視して続行
  }

  // 認証が必要なパス
  const protectedPaths = [
    "/app/mypage",
    "/app/reminder",
    "/app/groups",
  ];

  // 管理画面のパス（管理者またはオーガナイザー権限が必要）
  const isAdminPath = pathname.startsWith("/admin");

  // /admin へのアクセス時のリダイレクト処理
  if (pathname === "/admin") {
    // セッションを取得（管理画面用）
    let adminSession = null;
    try {
      adminSession = await auth();
    } catch {
      // エラーは無視
    }

    if (!adminSession) {
      // 未ログインの場合は管理画面ログインページにリダイレクト
      return NextResponse.redirect(new URL("/admin/auth?callbackUrl=/admin/dashboard", request.url));
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (adminSession.user?.role !== "ADMIN" && adminSession.user?.role !== "ORGANIZER") {
      return NextResponse.redirect(new URL("/app/mypage", request.url));
    }

    // ログイン済みの場合はダッシュボードにリダイレクト
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 管理画面のアクセス制御（/admin/auth と /admin/change-password を除く）
  if (isAdminPath && pathname !== "/admin/auth" && pathname !== "/admin/change-password") {
    // セッションが取得できた場合のみ権限チェック
    if (session) {
      // 管理者またはオーガナイザーのみアクセス可能
      if (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER") {
        return NextResponse.redirect(new URL("/app/mypage", request.url));
      }
    } else {
      // セッションが取得できない場合は、クッキーを確認
      const sessionCookie = request.cookies.get("__Secure-authjs.session-token");
      const jwtCookie = request.cookies.get("__Secure-authjs.pkce.code_verifier");

      if (!sessionCookie && !jwtCookie) {
        // セッションクッキーが存在しない場合は、未ログインと判断してリダイレクト
        const signInUrl = new URL("/admin/auth", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }
      // セッションクッキーが存在するが、middlewareで取得できない場合はクライアントサイドでチェック
    }
  }

  // ダッシュボード（/app）は /app/mypage にリダイレクト
  if (pathname === "/app") {
    return NextResponse.redirect(new URL("/app/mypage", request.url));
  }

  // ログインページ（/app/auth）、イベント掲載依頼フォーム（/app/event-submission）、お問い合わせフォーム（/app/contact）は認証が必要なパスではない
  const isDashboard = pathname.startsWith("/app/") && pathname !== "/app/auth" && pathname !== "/app/event-submission" && pathname !== "/app/contact";

  // 認証が必要なパスにアクセスしている場合
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  ) || isDashboard;

  // セッションが取得できなかった場合でも、クライアントサイドのuseSessionに任せる
  // データベースセッションを使用する場合、middleware.ts（Edge Runtime）ではセッションが取得できない可能性がある
  // その場合、クライアントサイドでセッションを確認し、必要に応じてリダイレクトする
  if (isProtectedPath && !session) {
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

  // ログイン済みで管理画面ログインページにアクセスしている場合
  if (pathname === "/admin/auth" && session && (session.user?.role === "ADMIN" || session.user?.role === "ORGANIZER")) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/admin";
    return NextResponse.redirect(new URL(callbackUrl, request.url));
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
     * - manifest.json (PWA manifest)
     * - icon-*.png (PWA icons)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-).*)",
  ],
};

