"use client";

import { useState, useEffect } from "react";
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

function SideNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const activeKey = resolveActiveKey(pathname);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // イベントページは常にアクセス可能
    if (href === "/events") {
      onClose();
      return;
    }
    
    // 未ログインで保護されたページにアクセスしようとした場合
    if (!session && href === "/app/mypage") {
      e.preventDefault();
      router.push(`/app/auth?callbackUrl=${encodeURIComponent(href)}`);
      onClose();
    } else {
      onClose();
    }
  };

  const displayName = session?.user?.name || session?.user?.email || "ゲスト";
  const isLoading = status === "loading";

  return (
    <>
      {/* オーバーレイ（SP版のみ） */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={onClose}
        />
      )}
      {/* サイドメニュー */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-56 border-r border-zinc-100 bg-white px-4 py-6 transition-transform duration-300 ease-in-out sm:sticky sm:translate-x-0 sm:flex sm:flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* 閉じるボタン（SP版のみ） */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div className="text-sm font-semibold text-zinc-900">
          痛車オーナーズポータル
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 sm:hidden"
          aria-label="メニューを閉じる"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
              onClick={() => {
                signOut({ callbackUrl: "/app/auth" });
                onClose();
              }}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              ログアウト
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <p className="text-xs text-zinc-600 mb-2">ログインしてください</p>
            <Link
              href="/app/auth"
              onClick={onClose}
              className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-center text-[10px] font-medium text-white transition hover:bg-zinc-800"
            >
              ログイン
            </Link>
          </div>
        )}
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
    </>
  );
}

function MobileHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10; // トップから10px以内は常に表示

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // 下にスクロール（50px以上スクロールしたら非表示）
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // 上にスクロール
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur transition-transform duration-300 ease-in-out sm:hidden ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <h1 className="text-sm font-semibold text-zinc-900">
        痛車オーナーズポータル
      </h1>
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm"
        aria-label="メニューを開く"
      >
        <svg
          className="h-6 w-6 text-zinc-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // 管理画面配下の場合は通常のレイアウトを適用しない
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  // メニューが開いている時はスクロールを無効化
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

  return (
    <div className="flex min-h-screen">
      <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
      <SideNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col pt-14 sm:pt-0">
        {children}
      </div>
    </div>
  );
}
