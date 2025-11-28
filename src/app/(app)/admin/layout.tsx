"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { MenuController } from "@/components/menu-controller";
import { LoadingSpinner } from "@/components/loading-spinner";

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
  { href: "/admin/submissions", label: "イベント掲載依頼フォーム", icon: "📝" },
  { href: "/admin/contacts", label: "お問い合わせ管理", icon: "💬" },
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
      {/* PC版のみタイトルを表示（モバイル版はヘッダーに表示されるため非表示） */}
      <div className="hidden border-b border-zinc-200 p-4 lg:block">
        <Link
          href="/admin/dashboard"
          className="flex items-center justify-center"
          onClick={onLinkClick}
        >
          <Image
            src="/images/main_logo.png"
            alt="いたなび！痛車オーナーズナビ"
            width={200}
            height={80}
            className="h-auto w-full max-w-[180px]"
            priority
          />
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

  // /admin配下のページを検索エンジンから除外
  useEffect(() => {
    if (typeof window === "undefined" || !document.head) {
      return;
    }
    // noindexメタタグを追加または更新（削除しない）
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      try {
        document.head.appendChild(metaRobots);
      } catch (error) {
        // エラーが発生した場合は無視
        console.debug("Meta tag append error (safe to ignore):", error);
        return;
      }
    }
    metaRobots.setAttribute("content", "noindex, nofollow");
  }, []);

  // メニューが開いている時はスクロールを無効化（すべてのHooksは早期リターンの前に配置）
  useEffect(() => {
    if (typeof window === "undefined" || !document.body) {
      return;
    }
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof window !== "undefined" && document.body) {
        document.body.style.overflow = "";
      }
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
        <LoadingSpinner size="lg" />
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
              className="flex items-center justify-center flex-1"
              onClick={() => setIsMenuOpen(false)}
            >
              <Image
                src="/images/main_logo.png"
                alt="いたなび！痛車オーナーズナビ"
                width={200}
                height={80}
                className="h-auto w-full max-w-[180px]"
                priority
              />
            </Link>
            <MenuController
              variant="close"
              onClick={() => setIsMenuOpen(false)}
            />
          </div>
          <SidebarContent onLinkClick={() => setIsMenuOpen(false)} pathname={pathname} session={session} />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden lg:w-auto w-screen">
        {/* ヘッダー（lg未満のみ） */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <MenuController
              variant="open"
              onClick={() => setIsMenuOpen(true)}
            />
            <Link href="/admin/dashboard" className="flex items-center">
              <Image
                src="/images/main_logo.png"
                alt="いたなび！痛車オーナーズナビ"
                width={150}
                height={60}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <span className="text-sm text-zinc-600">{session.user.email}</span>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

