"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { DisplayNameModal } from "@/components/display-name-modal";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

type AppLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: "/app/mypage", label: "マイページ", key: "mypage" },
  { href: "/events", label: "イベント", key: "events" },
  { href: "/app/event-submission", label: "イベント掲載依頼", key: "event-submission" },
  { href: "/app/contact", label: "お問い合わせ", key: "contact" },
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
    // イベントページとお問い合わせフォームは常にアクセス可能
    if (href === "/events" || href === "/app/contact") {
      onClose();
      return;
    }

    // 未ログインで保護されたページにアクセスしようとした場合
    if (!session && (href === "/app/mypage" || href === "/app/event-submission")) {
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
        className={`fixed top-0 left-0 z-50 flex h-screen w-56 flex-col border-r border-zinc-100 bg-white px-4 py-6 transition-transform duration-300 ease-in-out sm:sticky sm:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* 閉じるボタン（SP版のみ） */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link href="/app/mypage" className="flex items-center">
            <Image
              src="/images/main_logo.png"
              alt="いたなび！痛車オーナーズナビ"
              width={200}
              height={80}
              className="h-auto w-full max-w-[180px]"
              priority
            />
          </Link>
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
                onClick={async () => {
                  onClose();
                  // 現在のパスを確認して適切なログイン画面にリダイレクト
                  const currentPath = pathname || "/app/mypage";
                  const isAdminPath = currentPath.startsWith("/admin");
                  const redirectUrl = isAdminPath ? "/admin/auth" : "/app/auth";
                  
                  // ログアウト処理
                  await signOut({ redirect: false });
                  
                  // 明示的にリダイレクト
                  router.push(redirectUrl);
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
        <nav className="space-y-1 text-sm flex-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleNavClick(e, tab.href)}
                className={`block rounded-lg px-3 py-2 ${isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {(session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER") && (
          <div className="mt-auto border-t border-zinc-200 pt-4">
            <Link
              href="/admin/dashboard"
              onClick={(e) => handleNavClick(e, "/admin/dashboard")}
              className={`block rounded-lg px-3 py-2 text-sm ${pathname?.startsWith("/admin")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              オーガナイザー機能
            </Link>
          </div>
        )}
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
      className={`fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur transition-transform duration-300 ease-in-out sm:hidden ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <Link href="/app/mypage" className="flex items-center">
        <Image
          src="/images/main_logo.png"
          alt="いたなび！痛車オーナーズナビ"
          width={150}
          height={60}
          className="h-8 w-auto"
          priority
        />
      </Link>
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
  const { data: session, status } = useSession();
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [hasCheckedDisplayName, setHasCheckedDisplayName] = useState(false);

  // /app配下のページを検索エンジンから除外
  useEffect(() => {
    if (typeof window === "undefined" || !document.head) {
      return;
    }
    if (pathname?.startsWith("/app")) {
      // noindexメタタグを追加
      let metaRobots = document.querySelector('meta[name="robots"]');
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.setAttribute("name", "robots");
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else {
      // /app配下でない場合はnoindexメタタグを削除
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots && metaRobots.getAttribute("content") === "noindex, nofollow") {
        metaRobots.remove();
      }
    }
  }, [pathname]);

  // メニューが開いている時はスクロールを無効化
  // Hooksのルールに従い、早期リターンの前にすべてのHooksを呼ぶ
  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      // 管理画面ではスクロール制御は不要
      return;
    }
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
  }, [isMenuOpen, pathname]);

  // 表示名のチェック（ログイン時のみ）
  useEffect(() => {
    if (status === "loading" || hasCheckedDisplayName) return;
    if (pathname?.startsWith("/admin")) return; // 管理画面では表示しない

    if (session?.user) {
      // Cookieをチェック（「あとで」を選択した場合）
      const laterCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("display_name_later="));

      if (laterCookie) {
        // Cookieが存在する場合は期限をチェック
        const cookieValue = laterCookie.split("=")[1];
        const expireDate = new Date(cookieValue);
        const now = new Date();

        // 7日経過している場合は再度促す
        if (now > expireDate) {
          // Cookieを削除
          document.cookie = "display_name_later=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          // 表示名が未設定の場合はモーダルを表示
          if (!session.user.displayName) {
            setShowDisplayNameModal(true);
            setHasCheckedDisplayName(true);
          }
        } else {
          setHasCheckedDisplayName(true);
        }
      } else {
        // Cookieが存在しない場合、表示名が未設定ならモーダルを表示
        if (!session.user.displayName) {
          setShowDisplayNameModal(true);
          setHasCheckedDisplayName(true);
        } else {
          setHasCheckedDisplayName(true);
        }
      }
    } else {
      setHasCheckedDisplayName(true);
    }
  }, [session, status, pathname, hasCheckedDisplayName]);

  const handleSaveDisplayName = async (displayName: string) => {
    try {
      const res = await fetch("/api/user/display-name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      if (!res.ok) {
        throw new Error("Failed to save display name");
      }

      // セッションを更新
      await fetch("/api/auth/session?update");
      setShowDisplayNameModal(false);
      window.location.reload(); // セッションを反映させるためにリロード
    } catch (error) {
      console.error("Failed to save display name:", error);
      throw error;
    }
  };

  const handleLater = () => {
    // 7日後の日付を設定
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    // Cookieに保存
    document.cookie = `display_name_later=${expireDate.toISOString()}; expires=${expireDate.toUTCString()}; path=/;`;
    setShowDisplayNameModal(false);
    setHasCheckedDisplayName(true);
  };

  // 管理画面配下の場合は通常のレイアウトを適用しない
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
        <SideNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col pt-14 sm:pt-0">
          {children}
        </div>
      </div>
      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onClose={() => {
          setShowDisplayNameModal(false);
          setHasCheckedDisplayName(true);
        }}
        onSave={handleSaveDisplayName}
        onLater={handleLater}
      />
      <PWAInstallBanner />
    </>
  );
}
