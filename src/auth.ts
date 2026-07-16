import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import { getAuthSecret } from "@/lib/auth-secret";
import { db } from "@/lib/db";
import { users, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// DATABASE_URLが設定されているかチェック
const hasDatabaseUrl = !!(
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") ||
  (process.env.DB) ||
  (process.env.MOCK_DATABASE !== "true")
);

// Edge の middleware が auth を読み込むため、ここで getAdapter() を呼ぶと prisma（node:fs 等）が
// Edge バンドルに入りビルドが失敗する。アダプタは実際に NextAuth に渡すまで初期化しない。
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
  ],
  pages: {
    signIn: "/app/auth",
    error: "/app/auth",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
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
        return redirectUrl;
      }

      // /app/authにリダイレクトされる場合、callbackUrlパラメータを確認
      if (parsedUrl.pathname === "/app/auth") {
        const callbackUrl = parsedUrl.searchParams.get("callbackUrl");
        if (callbackUrl) {
          // callbackUrlが相対パスの場合
          if (callbackUrl.startsWith("/")) {
            const redirectUrl = `${baseUrl}${callbackUrl}`;
            return redirectUrl;
          }
          // callbackUrlが完全なURLの場合、同じオリジンのみ許可
          try {
            const callbackUrlObj = new URL(callbackUrl);
            if (callbackUrlObj.origin === baseUrl) {
              return callbackUrl;
            }
          } catch {
            // URLのパースに失敗した場合は無視
          }
        }
        // callbackUrlがない場合はマイページにリダイレクト
        const defaultRedirect = `${baseUrl}/app/mypage`;
        return defaultRedirect;
      }

      // urlが相対パスの場合（callbackUrlが指定されている場合）
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        return redirectUrl;
      }

      // 同じオリジンのURLの場合（完全なURLが指定されている場合）
      if (parsedUrl.origin === baseUrl) {
        return url;
      }

      // 外部URLの場合はデフォルトのマイページにリダイレクト
      const defaultRedirect = `${baseUrl}/app/mypage`;
      return defaultRedirect;
    },
    async session({ session, token }) {
      // JWT戦略では、トークンに保存された情報を使用（DBアクセスを削減）
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "USER";
        session.user.isBanned = (token.isBanned as boolean) || false;

        // メールアドレスをセッションに設定（nullの場合は空文字列）
        session.user.email = token.email || "";

        // 表示名をセッションに設定
        session.user.displayName = token.displayName || null;
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // DBから最新情報を取得してトークンを更新する関数
      const updateTokenFromDB = async () => {
        if (!hasDatabaseUrl || !token.id) return false;

        try {
          const dbUser = await db
            .select({
              id: users.id,
              role: users.role,
              isBanned: users.isBanned,
              email: users.email,
              displayName: users.displayName,
            })
            .from(users)
            .where(eq(users.id, token.id as string))
            .get();

          if (dbUser) {
            token.email = dbUser.email || undefined;
            token.role = dbUser.role;
            token.isBanned = dbUser.isBanned;
            token.displayName = dbUser.displayName || undefined;
            return true;
          }
        } catch (error) {
          console.error("[JWT] Error updating token from DB:", error);
        }
        return false;
      };

      // userがnullの場合（セッション更新時）、DBから最新情報を取得
      // NextAuth v5では、update()を呼んでもtriggerが"update"として渡されないため、
      // userがnullの場合にDBから最新情報を取得する
      if (!user) {
        const updated = await updateTokenFromDB();
        if (updated) return token;
      }

      // trigger === "update" の場合もDBから最新情報を取得（念のため）
      if (trigger === "update") {
        const updated = await updateTokenFromDB();
        if (updated) return token;
      }

      // 初回ログイン時のみDBからユーザー情報を取得
      // それ以降はトークンに保存された情報を使用（DBアクセスを削減）
      if (user) {
        token.id = user.id;
        // メールアドレスもトークンに保存（既存ユーザー検索用）
        if (user.email) {
          token.email = user.email;
        }

        // 初回ログイン時のみDBから最新情報を取得
        if (hasDatabaseUrl) {
          try {
            let dbUser = null;

            // まず、token.idで検索
            if (token.id) {
              dbUser = await db
                .select({
                  id: users.id,
                  role: users.role,
                  isBanned: users.isBanned,
                  email: users.email,
                  displayName: users.displayName,
                })
                .from(users)
                .where(eq(users.id, token.id as string))
                .get();
            }

            // token.idで見つからない場合、既存ユーザーを探す
            if (!dbUser) {
              // Twitter認証の場合、providerAccountIdを使用してAccountテーブルから既存ユーザーを検索
              if (account?.provider === "twitter" && account?.providerAccountId) {
                const existingAccount = await db
                  .select({
                    userId: accounts.userId,
                    id: users.id,
                    role: users.role,
                    isBanned: users.isBanned,
                    email: users.email,
                    displayName: users.displayName,
                  })
                  .from(accounts)
                  .innerJoin(users, eq(accounts.userId, users.id))
                  .where(
                    and(
                      eq(accounts.provider, "twitter"),
                      eq(accounts.providerAccountId, account.providerAccountId)
                    )
                  )
                  .get();

                if (existingAccount) {
                  dbUser = existingAccount;
                  token.id = dbUser.id;
                  token.email = dbUser.email || undefined; // トークンにもメールアドレスを保存
                  user.id = dbUser.id;
                  console.log(`[JWT] Found existing Twitter user via Account: ${dbUser.id} (${dbUser.email || "no email"})`);
                }
              }

              // Accountテーブルで見つからない場合、メールアドレスで検索（既存ユーザーを探す）
              // ただし、Twitter認証の場合はメールアドレスがないため、この検索はスキップ
              if (!dbUser) {
                // まず、user.emailまたはtoken.emailで検索
                const searchEmail = token.email || user?.email;

                // メールアドレスがある場合のみ検索（Twitter認証の場合はメールアドレスがない）
                if (searchEmail) {
                  const matchedUser = await db
                    .select({
                      id: users.id,
                      role: users.role,
                      isBanned: users.isBanned,
                      email: users.email,
                      displayName: users.displayName,
                    })
                    .from(users)
                    .where(eq(users.email, searchEmail))
                    .get();

                  // 既存のユーザーが見つかった場合、トークンのIDを更新
                  if (matchedUser) {
                    dbUser = matchedUser;
                    token.id = dbUser.id;
                    token.email = dbUser.email || undefined; // トークンにもメールアドレスを保存
                    token.displayName = dbUser.displayName || undefined;
                    user.id = dbUser.id;
                  }
                }
              }
            }

            // ユーザーが存在しない場合、データベースに作成する
            if (!dbUser) {
              try {
                // メールアドレスを決定（Twitter認証の場合はnull）
                const userEmail = user?.email || null;
                const newUserId = user.id || crypto.randomUUID();

                // メールアドレスがnullでもユーザーを作成できる（Twitter認証の場合）
                await db.insert(users).values({
                  id: newUserId,
                  email: userEmail,
                  name: user.name || null,
                  image: user.image || null,
                  role: (user.role as string) || "USER",
                  isBanned: (user.isBanned as boolean) || false,
                  isProfilePublic: false,
                  mustChangePassword: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                const createdUser = {
                  id: newUserId,
                  role: (user.role as string) || "USER",
                  isBanned: (user.isBanned as boolean) || false,
                  email: userEmail,
                  displayName: null as string | null,
                };

                dbUser = createdUser;
                token.id = createdUser.id;
                token.email = createdUser.email || undefined; // メールアドレスがnullの場合もトークンに保存
                token.displayName = undefined; // 表示名もトークンに保存
                user.id = createdUser.id;
                console.log(`[JWT] Created user in DB: ${createdUser.id} (${createdUser.email || "no email"})`);

                // Accountレコードも作成（JWT戦略では自動的に作成されないため）
                if (account?.provider && account?.providerAccountId) {
                  try {
                    await db.insert(accounts).values({
                      id: crypto.randomUUID(),
                      userId: createdUser.id,
                      type: account.type || "oauth",
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                      refreshToken: account.refresh_token || null,
                      accessToken: account.access_token || null,
                      expiresAt: account.expires_at || null,
                      tokenType: account.token_type || null,
                      scope: account.scope || null,
                      idToken: (typeof account.id_token === "string" ? account.id_token : null),
                      sessionState: (typeof account.session_state === "string" ? account.session_state : null),
                    });
                    console.log(`[JWT] Created Account record for ${account.provider} user: ${createdUser.id}`);
                  } catch (error) {
                    // Accountレコードの作成に失敗しても、ユーザー作成は成功しているので続行
                    console.error(`[JWT] Error creating Account record:`, error);
                  }
                }
              } catch (error) {
                console.error("[JWT] Error creating user in DB:", error);
                // エラーが発生した場合、トークンのIDをnullに設定
                token.id = null;
              }
            }

            if (dbUser) {
              token.role = dbUser.role;
              token.isBanned = dbUser.isBanned;
              token.displayName = dbUser.displayName || undefined;
            } else {
              // DBから取得できなかった場合は、userオブジェクトから取得
              token.role = (user.role as string) || "USER";
              token.isBanned = (user.isBanned as boolean) || false;
            }
          } catch (error) {
            // エラーが発生した場合は、userオブジェクトから取得
            token.role = (user.role as string) || "USER";
            token.isBanned = (user.isBanned as boolean) || false;
            console.error("[JWT] Error fetching user from DB:", error);
          }
        } else {
          // DATABASE_URLが設定されていない場合は、userオブジェクトから取得
          token.role = (user.role as string) || "USER";
          token.isBanned = (user.isBanned as boolean) || false;
        }
      }
      // セッション更新時（userが存在しない場合）は、トークンに既に保存された情報を使用
      // DBアクセスは行わない（JWT戦略の利点を活かす）
      return token;
    },
  },
  session: {
    strategy: "jwt" as const, // 常にJWT戦略を使用（DB負荷軽減のため）
  },
};

// NextAuth v5では、AUTH_URLを優先的に使用（NEXTAUTH_URLは後方互換性のためにサポート）
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
if (authUrl) {
  console.log(`[NextAuth] AUTH_URL/NEXTAUTH_URL is set to: ${authUrl}`);
} else {
  console.warn(
    "[NextAuth] AUTH_URL/NEXTAUTH_URL is not set. NextAuth will try to detect the URL from the request."
  );
}

// adapterが存在する場合のみ設定
// 開発環境では、古いセッションクッキーの問題を回避するため、adapterを使用しない
const config: NextAuthConfig = {
  ...configBase,
  // adapterは将来の拡張性のために保持（現在はJWT戦略のみ使用）
  secret: getAuthSecret(),
  // 無効なセッションクッキーを無視する（NEXTAUTH_SECRETが変更された場合など）
  trustHost: true,
  // セッションのエラーハンドリングを改善
  // 本番環境でも一時的にデバッグを有効にしてリダイレクトURIを確認
  debug: true,
  events: {
    async signOut() {
      // サインアウト時の処理
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

