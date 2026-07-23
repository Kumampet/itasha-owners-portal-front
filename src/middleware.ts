import { getToken } from "next-auth/jwt";
import {
  getRequestCountryCode,
  shouldBlockGdprRegion,
  shouldSkipGdprGeoBlock,
} from "@/lib/gdpr-geo";
import { getAuthSecret, getUseSecureAuthCookie } from "@/lib/auth-secret";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Edge では `@/auth`（prisma 経由のバンドル）を避け、JWT クッキーからセッション相当を復元する */
async function getSessionFromJwtCookie(
  request: NextRequest,
): Promise<{ user: { id: string; role: string; email: string } } | null> {
  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
    secureCookie: getUseSecureAuthCookie(),
  });
  if (!token) {
    return null;
  }
  const id =
    (typeof token.id === "string" ? token.id : null) ??
    (typeof token.sub === "string" ? token.sub : "") ??
    "";
  return {
    user: {
      id,
      role: (typeof token.role === "string" ? token.role : "") || "USER",
      email: (typeof token.email === "string" ? token.email : "") || "",
    },
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル（manifest.json、アイコンファイルなど）は早期リターン
  if (
    pathname === "/manifest.json" ||
    pathname.startsWith("/icon-") ||
    pathname === "/favicon.ico" ||
    pathname === "/ads.txt" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Basic Authentication
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPass = process.env.BASIC_AUTH_PASS;
  if (basicAuthUser && basicAuthPass) {
    const authHeader = request.headers.get("authorization");
    let authorized = false;
    if (authHeader?.startsWith("Basic ")) {
      try {
        const credentials = atob(authHeader.split(" ")[1]);
        const [user, pass] = credentials.split(":");
        if (user === basicAuthUser && pass === basicAuthPass) {
          authorized = true;
        }
      } catch (e) {
        // Ignored
      }
    }
    if (!authorized) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }
  }

  // EU/EEA/英国ほか関連法域（GDPR_BLOCKED_COUNTRY_CODES）からのアクセスを拒否（ローカルホストなどは別途スキップ）
  // 国コードは CloudFront Viewer Country / x-vercel-ip-country / cf-ipcountry を利用
  if (!shouldSkipGdprGeoBlock(request)) {
    const countryCode = getRequestCountryCode(request);
    if (shouldBlockGdprRegion(countryCode)) {
      const bodyJa =
        "このサービスは欧州経済領域（EEA）、英国および本ポリシーで対象とする関連法域からは提供していません。\n\n";
      const bodyEn =
        "This service is not offered from the European Economic Area (EEA), the United Kingdom, or other jurisdictions we restrict under our policies.\n";
      return new NextResponse(bodyJa + bodyEn, {
        status: 451,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      });
    }
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

  // 団体詳細ページ（/app/groups/[id]）は認証不要（未ログインでも閲覧可能）
  // ただし、メッセージ機能はログインが必要
  if (pathname.match(/^\/app\/groups\/[^/]+$/)) {
    return NextResponse.next();
  }

  // 認証が必要なパスでのみauth()を呼び出す
  let session = null;
  try {
    // /app配下または/admin配下のパスにアクセスする場合にauth()を呼び出す
    if (pathname.startsWith("/app/") || pathname.startsWith("/admin")) {
      session = await getSessionFromJwtCookie(request);
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
    // 既に取得したセッションを使用（37-39行目で取得済み）
    if (!session) {
      // 未ログインの場合は一般アプリのログインページにリダイレクト
      return NextResponse.redirect(new URL("/app/auth?callbackUrl=/admin/dashboard", request.url));
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER") {
      return NextResponse.redirect(new URL("/app/mypage", request.url));
    }

    // ログイン済みの場合はダッシュボードにリダイレクト
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // セッションクッキーの存在確認（共通処理）
  const hasSessionCookie = () => {
    const sessionCookie = request.cookies.get("__Secure-authjs.session-token");
    const jwtCookie = request.cookies.get("__Secure-authjs.pkce.code_verifier");
    return !!(sessionCookie || jwtCookie);
  };

  // 未ログイン時のリダイレクト処理（共通処理）
  const redirectToSignIn = (callbackUrl?: string) => {
    const signInUrl = new URL("/app/auth", request.url);
    if (callbackUrl) {
      signInUrl.searchParams.set("callbackUrl", callbackUrl);
    }
    return NextResponse.redirect(signInUrl);
  };

  // クエリパラメータを含む完全なパスを取得するヘルパー関数
  const getFullPath = () => {
    return request.nextUrl.pathname + request.nextUrl.search;
  };

  // 管理画面のアクセス制御
  if (isAdminPath) {
    // セッションが取得できた場合のみ権限チェック
    if (session) {
      // 管理者またはオーガナイザーのみアクセス可能
      if (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER") {
        return NextResponse.redirect(new URL("/app/mypage", request.url));
      }
    } else {
      // セッションが取得できない場合は、クッキーを確認
      if (!hasSessionCookie()) {
        // セッションクッキーが存在しない場合は、未ログインと判断してリダイレクト
        // クエリパラメータを含む完全なパスをcallbackUrlとして渡す
        return redirectToSignIn(getFullPath());
      }
      // セッションクッキーが存在するが、middlewareで取得できない場合はクライアントサイドでチェック
    }
  }

  // ダッシュボード（/app）は /app/mypage にリダイレクト
  if (pathname === "/app") {
    return NextResponse.redirect(new URL("/app/mypage", request.url));
  }

  // ログインページ（/app/auth）、イベント掲載依頼フォーム（/app/event-submission）、お問い合わせフォーム（/app/contact）、団体詳細ページ（/app/groups/[id]）は認証が必要なパスではない
  const isPublicGroupDetailPage = pathname.match(/^\/app\/groups\/[^/]+$/);
  const isDashboard = pathname.startsWith("/app/") && pathname !== "/app/auth" && pathname !== "/app/event-submission" && pathname !== "/app/contact" && !isPublicGroupDetailPage;

  // 認証が必要なパスにアクセスしている場合
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  ) || isDashboard;

  // セッションが取得できなかった場合でも、クライアントサイドのuseSessionに任せる
  // JWT戦略を使用している場合、middleware.ts（Edge Runtime）ではセッションが取得できない可能性がある
  // その場合、クライアントサイドでセッションを確認し、必要に応じてリダイレクトする
  if (isProtectedPath && !session) {
    // セッションクッキーが存在しない場合は、未ログインと判断してリダイレクト
    if (!hasSessionCookie()) {
      // クエリパラメータを含む完全なパスをcallbackUrlとして渡す
      return redirectToSignIn(getFullPath());
    }
    // セッションクッキーが存在する場合は、クライアントサイドでセッションを確認させる
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
     * API も地理ブロック対象に含める（GDPR 対象域からの API 利用を防ぐため）。
     * 除外: _next 静的・画像最適化、PWA 用アイコン類、ファビコン。
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)",
  ],
};

