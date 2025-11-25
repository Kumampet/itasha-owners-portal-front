"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // 未ログインの場合はログインページにリダイレクト
    if (!session) {
      router.push("/admin/auth?callbackUrl=/admin");
      return;
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (session.user.role !== "ADMIN" && !session.user.isOrganizer) {
      router.push("/app/mypage");
      return;
    }

    // 初回ログイン時（パスワード変更が必要）はパスワード変更ページにリダイレクト
    if (session.user.mustChangePassword && !window.location.pathname.includes("/change-password")) {
      router.push("/admin/change-password");
      return;
    }
  }, [session, status, router]);

  // ローディング中または権限チェック中は何も表示しない
  if (
    status === "loading" ||
    !session ||
    (session.user.role !== "ADMIN" && !session.user.isOrganizer)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="text-lg font-semibold text-zinc-900 hover:text-zinc-700">
            管理画面
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/events"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              イベント管理
            </Link>
            <span className="text-sm text-zinc-600">
              {session.user.email}
            </span>
            <a
              href="/app/mypage"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              アプリに戻る
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

