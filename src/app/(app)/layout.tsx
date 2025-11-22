"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

type AppLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: "/app/mypage", label: "ホーム", key: "mypage" },
  { href: "/events", label: "イベント", key: "events" },
];

function resolveActiveKey(pathname: string) {
  const normalized = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) return "";
  
  // /events の場合は "events" を返す
  if (segments[0] === "events") {
    return "events";
  }
  
  // /app 配下の場合は2番目のセグメントを返す
  if (segments[0] === "app" && segments.length > 1) {
    // /app/mypage の場合は "mypage" を返す
    if (segments[1] === "mypage") {
      return "mypage";
    }
    return segments[1];
  }
  
  // /app のみの場合は "mypage" を返す（リダイレクトされるが、念のため）
  if (segments[0] === "app") {
    return "mypage";
  }
  
  return segments[0];
}

function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const activeKey = resolveActiveKey(pathname);

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // イベントページは常にアクセス可能
    if (href === "/events") {
      return;
    }
    
    // 未ログインで保護されたページにアクセスしようとした場合
    if (!session && href === "/app/mypage") {
      e.preventDefault();
      router.push(`/app/auth?callbackUrl=${encodeURIComponent(href)}`);
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 px-2 py-2.5 backdrop-blur sm:hidden">
      <ul className="flex items-center justify-between text-[11px]">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href)}
                className={`flex flex-col items-center rounded-full px-3 py-1.5 ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const activeKey = resolveActiveKey(pathname);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // イベントページは常にアクセス可能
    if (href === "/events") {
      return;
    }
    
    // 未ログインで保護されたページにアクセスしようとした場合
    if (!session && href === "/app/mypage") {
      e.preventDefault();
      router.push(`/app/auth?callbackUrl=${encodeURIComponent(href)}`);
    }
  };

  const displayName = session?.user?.name || session?.user?.email || "ゲスト";
  const isLoading = status === "loading";

  return (
    <aside className="sticky top-0 hidden h-screen w-56 border-r border-zinc-100 bg-white px-4 py-6 sm:flex sm:flex-col">
      <div className="mb-6 text-sm font-semibold text-zinc-900">
        痛車オーナーズポータル
      </div>
      {/* ユーザー情報表示領域（固定サイズでレイアウトシフトを防止） */}
      <div className="mb-4 min-h-[80px] rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
          </div>
        ) : session ? (
          <>
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 truncate">
                  {session.user?.name || "ユーザー"}
                </p>
                {session.user?.email && (
                  <p className="text-[10px] text-zinc-600 truncate">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              ログアウト
            </button>
          </>
        ) : null}
      </div>
      <nav className="space-y-1 text-sm">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={(e) => handleNavClick(e, tab.href)}
              className={`block rounded-lg px-3 py-2 ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex min-h-screen flex-1 flex-col pb-14 sm:pb-0">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
