import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

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
    // 動的インポートでPrisma AdapterとPrisma Clientを読み込む
    // これにより、DATABASE_URLが設定されていない場合はPrisma Clientが初期化されない
    // ただし、requireを使うとモジュールが読み込まれるため、実際の初期化は遅延される
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaAdapter } = require("@auth/prisma-adapter");
    
    // Prisma Clientを動的にインポート（実際に使用される時点で初期化される）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prismaModule = require("@/lib/prisma");
    const { prisma } = prismaModule;
    
    // PrismaAdapterを呼び出すと、Prisma Clientのプロパティにアクセスしようとし、
    // その際にPrisma Clientが初期化される
    // DATABASE_URLが未設定の場合は、この時点でエラーが発生する
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter = PrismaAdapter(prisma) as any; // TODO: 型エラーを回避するための一時的な対応
    return adapter;
  } catch (error) {
    console.error("Failed to create Prisma Adapter:", error);
    console.error("This is expected if DATABASE_URL is not set.");
    adapter = undefined;
    return undefined;
  }
};

// adapterを取得
const adapterInstance = getAdapter();
const useDatabaseStrategy = hasDatabaseUrl && adapterInstance !== undefined;

// プロバイダー設定（後でCognito、X、Googleを追加）
// DATABASE_URLが設定されている場合のみadapterを設定
const configBase: NextAuthConfig = {
  providers: [
    // TODO: AWS Cognito、X、Googleプロバイダーを追加
  ],
  pages: {
    signIn: "/app/auth",
    error: "/app/auth",
  },
  callbacks: {
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
              },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.isOrganizer = dbUser.is_organizer;
              token.isBanned = dbUser.is_banned;
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

// AUTH_SECRETが設定されていない場合は開発環境用のデフォルト値を使用
// 本番環境では必ずAUTH_SECRETを設定すること
const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development"
    ? "development-secret-key-change-in-production"
    : undefined);

if (!authSecret && process.env.NODE_ENV === "production") {
  console.error(
    "AUTH_SECRET or NEXTAUTH_SECRET environment variable is required in production."
  );
}

// adapterが存在する場合のみ設定
const config: NextAuthConfig = {
  ...configBase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(adapterInstance ? { adapter: adapterInstance as any } : {}),
  secret: authSecret,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

