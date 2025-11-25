"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: "/admin/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/events", label: "イベント管理", icon: "📅" },
];

// adminのみ表示するメニュー項目
const adminOnlyMenuItems = [
  { href: "/admin/users", label: "ユーザー管理", icon: "👥" },
  { href: "/admin/submissions", label: "情報提供フォーム", icon: "📝" },
  { href: "/admin/organizers/new", label: "オーガナイザー作成", icon: "👤" },
];

type SidebarContentProps = {
  onLinkClick?: () => void;
  pathname: string | null;
  session: { user: { role: string; email: string } };
};

function SidebarContent({ onLinkClick, pathname, session }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 p-4">
        <Link
          href="/admin/dashboard"
          className="text-lg font-semibold text-zinc-900 hover:text-zinc-700"
          onClick={onLinkClick}
        >
          オーガナイザー機能
        </Link>
      </div>
      <nav className="flex-1 p-4">
        {/* 新規イベントを作成ボタン */}
        <Link
          href="/admin/events/new"
          className={`mb-4 flex items-center gap-3 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition ${pathname === "/admin/events/new"
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-900 hover:bg-zinc-50 hover:border-zinc-900"
            }`}
          onClick={onLinkClick}
        >
          <span>➕</span>
          <span>新規イベントを作成</span>
        </Link>
        <div className="mb-4 border-t border-zinc-200"></div>
        {/* 通常のメニュー項目 */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                onClick={onLinkClick}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* adminのみ表示するメニュー項目 */}
          {session.user.role === "ADMIN" &&
            adminOnlyMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  onClick={onLinkClick}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
      <div className="border-t border-zinc-200 p-4">
        <div className="mb-2 text-xs text-zinc-600">{session.user.email}</div>
        <Link
          href="/app/mypage"
          className="text-xs text-zinc-600 hover:text-zinc-900"
          onClick={onLinkClick}
        >
          アプリに戻る
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ログインページとパスワード変更ページでは認証チェックをスキップ
  const isAuthPage = pathname === "/admin/auth";
  const isChangePasswordPage = pathname === "/admin/change-password";

  // メニューが開いている時はスクロールを無効化（すべてのHooksは早期リターンの前に配置）
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // ログインページでは認証チェックをスキップ
    if (isAuthPage) {
      return;
    }

    if (status === "loading" || hasRedirected.current) return;

    // 未ログインの場合はログインページにリダイレクト
    if (!session) {
      hasRedirected.current = true;
      router.replace("/admin/auth?callbackUrl=/admin/dashboard");
      return;
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      hasRedirected.current = true;
      router.replace("/app/mypage");
      return;
    }

    // 初回ログイン時（パスワード変更が必要）はパスワード変更ページにリダイレクト
    if (session.user.mustChangePassword && !isChangePasswordPage) {
      hasRedirected.current = true;
      router.replace("/admin/change-password");
      return;
    }

    hasRedirected.current = false;
  }, [session, status, router, pathname, isAuthPage, isChangePasswordPage]);

  // ログインページとパスワード変更ページでは認証チェックをスキップ（ページ側で処理）
  if (isAuthPage || isChangePasswordPage) {
    return <>{children}</>;
  }

  // ローディング中または権限チェック中は何も表示しない
  if (
    status === "loading" ||
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen">
      {/* オーバーレイ（lg未満のみ） */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* サイドバー（PC版 - lg以上で表示） */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-zinc-200 bg-white lg:block">
        <SidebarContent pathname={pathname} session={session} />
      </aside>

      {/* サイドバー（モバイル版 - lg未満でハンバーガーメニュー） */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out lg:hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 p-4">
            <Link
              href="/admin/dashboard"
              className="text-lg font-semibold text-zinc-900 hover:text-zinc-700"
              onClick={() => setIsMenuOpen(false)}
            >
              オーガナイザー機能
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
              aria-label="メニューを閉じる"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <SidebarContent onLinkClick={() => setIsMenuOpen(false)} pathname={pathname} session={session} />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex min-h-screen flex-1 flex-col lg:w-auto w-screen">
        {/* ヘッダー（lg未満のみ） */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
              aria-label="メニューを開く"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/admin/dashboard" className="text-lg font-semibold text-zinc-900">
              オーガナイザー機能
            </Link>
            <span className="text-sm text-zinc-600">{session.user.email}</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

