"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MobileHeader } from "@/components/mobile-header";
import { SideNav } from "@/components/side-nav";

type AdminLayoutClientProps = {
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
  { href: "/admin/groups", label: "団体モデレーション", icon: "👥" },
  { href: "/admin/organizer-applications", label: "オーガナイザー申請一覧", icon: "📋" },
];

type SidebarContentProps = {
  onLinkClick?: () => void;
  pathname: string | null;
  session: { user: { role: string; email: string } };
};

function AdminSidebarContent({ onLinkClick, pathname, session }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 sm:p-4">
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
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <div className="mb-2 text-xs text-zinc-600">{session.user.email}</div>
          <Link
            href="/app/mypage"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-900"
            onClick={onLinkClick}
          >
            <span>🔙</span>
            <span>アプリに戻る</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    if (status === "loading" || hasRedirected.current) return;

    // 未ログインの場合は一般アプリのログインページにリダイレクト
    if (!session) {
      hasRedirected.current = true;
      router.replace("/app/auth?callbackUrl=/admin/dashboard");
      return;
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      hasRedirected.current = true;
      router.replace("/app/mypage");
      return;
    }

    hasRedirected.current = false;
  }, [session, status, router, pathname]);

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
      <SideNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        logoHref="/admin/dashboard"
        breakpoint="sm"
        width="64"
        showPCLogo={true}
      >
        <AdminSidebarContent
          onLinkClick={() => setIsMenuOpen(false)}
          pathname={pathname}
          session={session}
        />
      </SideNav>

      {/* メインコンテンツ */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden lg:w-auto w-screen">
        {/* ヘッダー（lg未満のみ） */}
        <MobileHeader
          onMenuClick={() => setIsMenuOpen(true)}
          logoHref="/admin/dashboard"
          rightContent={<span className="text-sm text-zinc-600">{session.user.email}</span>}
          enableAutoHide={true}
        />
        <main className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
