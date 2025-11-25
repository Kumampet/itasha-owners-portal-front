import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// DATABASE_URLが設定されているかチェック
const hasDatabaseUrl = !!(
  process.env.DATABASE_URL &&
  typeof process.env.DATABASE_URL === "string" &&
  process.env.DATABASE_URL.trim() !== ""
);

// DATABASE_URLが設定されている場合のみPrisma Adapterを使用
let adapter: ReturnType<typeof import("@auth/prisma-adapter").PrismaAdapter> | undefined;

const getAdapter = () => {
  // 既に作成済みの場合はそれを返す
  if (adapter !== undefined) {
    return adapter;
  }

  // DATABASE_URLが設定されていない場合はundefinedを返す
  if (!hasDatabaseUrl) {
    console.warn("DATABASE_URL is not set. Authentication will use JWT strategy.");
    adapter = undefined;
    return undefined;
  }

  try {
    // DATABASE_URLが設定されているか再確認（実行時に再チェック）
    const databaseUrl = process.env.DATABASE_URL;
    console.log("[Auth Debug] getAdapter - DATABASE_URL check:", {
      exists: !!databaseUrl,
      type: typeof databaseUrl,
      length: databaseUrl ? databaseUrl.length : 0,
      prefix: databaseUrl ? databaseUrl.substring(0, 20) : "not set",
    });

    if (!databaseUrl || typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
      console.warn("[Auth Debug] DATABASE_URL is not set at runtime. Skipping Prisma Adapter initialization.");
      adapter = undefined;
      return undefined;
    }

    // 動的インポートでPrisma AdapterとPrisma Clientを読み込む
    // これにより、DATABASE_URLが設定されていない場合はPrisma Clientが初期化されない
    // ただし、requireを使うとモジュールが読み込まれるため、実際の初期化は遅延される
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaAdapter } = require("@auth/prisma-adapter");

    // Prisma Clientを動的にインポート（実際に使用される時点で初期化される）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prismaModule = require("@/lib/prisma");
    const { prisma } = prismaModule;

    if (!prisma) {
      throw new Error("Prisma Client is not available");
    }

    // PrismaAdapterを呼び出すと、Prisma Clientのプロパティにアクセスしようとし、
    // その際にPrisma Clientが初期化される
    // DATABASE_URLが未設定の場合は、この時点でエラーが発生する
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter = PrismaAdapter(prisma) as any; // TODO: 型エラーを回避するための一時的な対応
    console.log("[Auth Debug] Prisma Adapter created successfully");
    return adapter;
  } catch (error) {
    console.error("[Auth Debug] Failed to create Prisma Adapter:", error);
    if (error instanceof Error) {
      console.error("[Auth Debug] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      // DATABASE_URL関連のエラーの場合は詳細を出力
      if (error.message.includes("replace") || error.message.includes("DATABASE_URL")) {
        console.error("[Auth Debug] DATABASE_URL at error time:", {
          exists: !!process.env.DATABASE_URL,
          type: typeof process.env.DATABASE_URL,
          value: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "not set",
        });
      }
    }
    console.warn("[Auth Debug] Falling back to JWT strategy due to Prisma Adapter error.");
    adapter = undefined;
    return undefined;
  }
};

// adapterを取得
const adapterInstance = getAdapter();
// セッション戦略を決定
// 注意: 開発環境では一時的にJWT戦略を使用（古いセッションクッキーの問題を回避）
// 本番環境では、DATABASE_URLが設定されている場合はdatabase戦略を使用
const useDatabaseStrategy =
  process.env.NODE_ENV === "production" &&
  hasDatabaseUrl &&
  adapterInstance !== undefined;

// デバッグ: セッション戦略をログに出力
console.log("[Auth Debug] Session strategy:", useDatabaseStrategy ? "database" : "jwt");
console.log("[Auth Debug] hasDatabaseUrl:", hasDatabaseUrl);
console.log("[Auth Debug] adapterInstance:", adapterInstance ? "exists" : "undefined");
console.log("[Auth Debug] NODE_ENV:", process.env.NODE_ENV);
console.log("[Auth Debug] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "設定済み" : "未設定");
console.log("[Auth Debug] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "設定済み" : "未設定");
console.log("[Auth Debug] NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "未設定（自動検出）");

// プロバイダー設定（Google、X、管理画面用Credentials）
// DATABASE_URLが設定されている場合のみadapterを設定
const configBase: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // 同じメールアドレスで複数プロバイダーをリンク
      // 明示的にリダイレクトURIを設定（オプション、trustHostがtrueの場合は自動検出される）
    }),
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // 同じメールアドレスで複数プロバイダーをリンク
    }),
    // 管理画面用のメール/パスワード認証
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (!hasDatabaseUrl) {
          console.error("DATABASE_URL is not set. Cannot authenticate admin user.");
          return null;
        }

        try {
          const { prisma } = await import("@/lib/prisma");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              is_organizer: true,
              is_banned: true,
              custom_profile_url: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          // パスワードの検証
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            return null;
          }

          // 管理者またはオーガナイザーのみログイン可能
          if (user.role !== "ADMIN" && !user.is_organizer) {
            return null;
          }

          // must_change_passwordフィールドも取得
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              must_change_password: true,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isOrganizer: user.is_organizer,
            isBanned: user.is_banned,
            customProfileUrl: user.custom_profile_url,
            mustChangePassword: dbUser?.must_change_password || false,
          };
        } catch (error) {
          console.error("Admin authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/app/auth",
    error: "/app/auth",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("[Auth Debug] Redirect callback:", { url, baseUrl });

      // URLをパースしてクエリパラメータを確認
      let parsedUrl: URL;
      try {
        // urlが相対パスの場合はbaseUrlと結合
        if (url.startsWith("/")) {
          parsedUrl = new URL(url, baseUrl);
        } else {
          parsedUrl = new URL(url);
        }
      } catch {
        // URLのパースに失敗した場合は相対パスとして扱う
        const redirectUrl = `${baseUrl}${url}`;
        console.log("[Auth Debug] URL parse failed, treating as relative:", redirectUrl);
        return redirectUrl;
      }

      // /app/authにリダイレクトされる場合、callbackUrlパラメータを確認
      if (parsedUrl.pathname === "/app/auth") {
        const callbackUrl = parsedUrl.searchParams.get("callbackUrl");
        if (callbackUrl) {
          // callbackUrlが相対パスの場合
          if (callbackUrl.startsWith("/")) {
            const redirectUrl = `${baseUrl}${callbackUrl}`;
            console.log("[Auth Debug] Found callbackUrl in query, redirecting to:", redirectUrl);
            return redirectUrl;
          }
          // callbackUrlが完全なURLの場合、同じオリジンのみ許可
          try {
            const callbackUrlObj = new URL(callbackUrl);
            if (callbackUrlObj.origin === baseUrl) {
              console.log("[Auth Debug] Found callbackUrl in query (full URL), redirecting to:", callbackUrl);
              return callbackUrl;
            }
          } catch {
            // URLのパースに失敗した場合は無視
          }
        }
        // callbackUrlがない場合はマイページにリダイレクト
        const defaultRedirect = `${baseUrl}/app/mypage`;
        console.log("[Auth Debug] No callbackUrl found, redirecting to default:", defaultRedirect);
        return defaultRedirect;
      }

      // urlが相対パスの場合（callbackUrlが指定されている場合）
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("[Auth Debug] Redirecting to relative path:", redirectUrl);
        return redirectUrl;
      }

      // 同じオリジンのURLの場合（完全なURLが指定されている場合）
      if (parsedUrl.origin === baseUrl) {
        console.log("[Auth Debug] Redirecting to same origin:", url);
        return url;
      }

      // 外部URLの場合はデフォルトのマイページにリダイレクト
      const defaultRedirect = `${baseUrl}/app/mypage`;
      console.log("[Auth Debug] External URL, redirecting to default:", defaultRedirect);
      return defaultRedirect;
    },
    async session({ session, user, token }) {
      // database strategyの場合
      if (user && useDatabaseStrategy) {
        try {
          const { prisma } = await import("@/lib/prisma");
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              role: true,
              is_organizer: true,
              is_banned: true,
              custom_profile_url: true,
            },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.isOrganizer = dbUser.is_organizer;
            session.user.isBanned = dbUser.is_banned;
            session.user.customProfileUrl = dbUser.custom_profile_url;
          }
        } catch (error) {
          console.error("Failed to fetch user from database:", error);
        }
      }
      // jwt strategyの場合
      if (token && !user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isOrganizer = token.isOrganizer as boolean;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword || false;
        // DATABASE_URLが設定されている場合はデータベースから取得
        if (hasDatabaseUrl) {
          try {
            const { prisma } = await import("@/lib/prisma");
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                role: true,
                is_organizer: true,
                is_banned: true,
                must_change_password: true,
              },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.isOrganizer = dbUser.is_organizer;
              token.isBanned = dbUser.is_banned;
              token.mustChangePassword = dbUser.must_change_password;
            }
          } catch (error) {
            console.error("Failed to fetch user from database:", error);
          }
        }
      }
      return token;
    },
  },
  session: {
    strategy: useDatabaseStrategy ? ("database" as const) : ("jwt" as const),
  },
};

// NEXTAUTH_SECRETは開発環境・本番環境問わず必須
// 実際のGoogleアカウントを使用するため、ダミー値ではなく正規の値を設定すること
const authSecret = process.env.NEXTAUTH_SECRET;

// デバッグ: NEXTAUTH_SECRETの読み込み状況を確認
console.log("[Auth Debug] NEXTAUTH_SECRET:", authSecret ? `設定済み（長さ: ${authSecret.length}文字）` : "未設定");

if (!authSecret) {
  const errorMessage =
    "NEXTAUTH_SECRET environment variable is required. " +
    "Please generate a secret key using: openssl rand -base64 32";
  console.error(errorMessage);
  if (process.env.NODE_ENV === "production") {
    throw new Error(errorMessage);
  } else {
    // 開発環境でもエラーを投げる（実際のGoogleアカウントを使用するため）
    throw new Error(errorMessage);
  }
}

// adapterが存在する場合のみ設定
// 開発環境では、古いセッションクッキーの問題を回避するため、adapterを使用しない
const config: NextAuthConfig = {
  ...configBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(useDatabaseStrategy && adapterInstance ? { adapter: adapterInstance as any } : {}),
  secret: authSecret,
  // 無効なセッションクッキーを無視する（NEXTAUTH_SECRETが変更された場合など）
  trustHost: true,
  // セッションのエラーハンドリングを改善
  // 本番環境でも一時的にデバッグを有効にしてリダイレクトURIを確認
  debug: true,
  // セッションクッキーの設定を改善（データベースセッション使用時）
  // データベースセッションを使用する場合、JWTセッションクッキーと区別するため、クッキー名を変更
  cookies: useDatabaseStrategy
    ? {
      sessionToken: {
        name: "__Secure-authjs.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      // 古いJWTセッションクッキーを無視するため、JWTセッションクッキー名を明示的に設定しない
    }
    : undefined,
  // エラー時の処理を改善
  events: {
    async signIn({ user, account }) {
      // サインイン成功時のログ
      console.log("[Auth Debug] Sign in successful:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      });
    },
    async signOut() {
      // サインアウト時のログ
      console.log("[Auth Debug] Sign out");
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

