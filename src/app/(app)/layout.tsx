"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DisplayNameModal } from "@/components/display-name-modal";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { EmailRequiredBanner } from "@/components/email-required-banner";
import { MobileHeader } from "@/components/mobile-header";
import { SideNav } from "@/components/side-nav";
import { SideNavUserSection } from "@/components/side-nav-user-section";

type AppLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: "/app/mypage", label: "マイページ", key: "mypage", icon: "👤" },
  { href: "/events", label: "イベント一覧", key: "events", icon: "📅" },
  { href: "/app/watchlist", label: "ウォッチリスト", key: "watchlist", requiresAuth: true, icon: "⭐" },
  { href: "/app/reminder", label: "リマインダー管理", key: "reminder", requiresAuth: true, icon: "⏰" },
  // 一時的に団体機能を無効化（メンテナンス中）
  { href: "/app/groups", label: "団体管理", key: "groups", requiresAuth: true, icon: "👥", disabled: true },
  { href: "/app/event-submission", label: "イベント掲載依頼", key: "event-submission", icon: "📝" },
  { href: "/app/organizer-application", label: "オーガナイザー登録申請", key: "organizer-application", icon: "📋" },
  { href: "/app/contact", label: "お問い合わせ", key: "contact", icon: "💬" },
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
    // /app/watchlist, /app/reminder, /app/groups などの場合はそのまま返す
    return segments[1];
  }

  // /app のみの場合は "mypage" を返す（リダイレクトされるが、念のため）
  if (segments[0] === "app") {
    return "mypage";
  }

  return segments[0];
}

function AppSideNavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const activeKey = resolveActiveKey(pathname);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // イベントページ、お問い合わせフォーム、イベント掲載依頼フォーム、オーガナイザー登録申請は常にアクセス可能
    if (href === "/events" || href === "/app/contact" || href === "/app/event-submission" || href === "/app/organizer-application") {
      onClose();
      return;
    }

    // 未ログインで保護されたページにアクセスしようとした場合
    const protectedPaths = [
      "/app/mypage",
      "/app/watchlist",
      "/app/reminder",
      // 一時的に団体機能を無効化
      // "/app/groups",
    ];
    if (!session && protectedPaths.includes(href)) {
      e.preventDefault();
      router.push(`/app/auth?callbackUrl=${encodeURIComponent(href)}`);
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div className="flex h-full flex-col p-0 sm:px-4 sm:py-6">
      <SideNavUserSection onClose={onClose} />
      <nav className="space-y-1 text-sm flex-1">
        {tabs.map((tab) => {
          // ログインが必要なメニュー項目は、ログインしていない場合は非表示
          if (tab.requiresAuth && !session) {
            return null;
          }
          const isActive = tab.key === activeKey;
          const isDisabled = (tab as { disabled?: boolean }).disabled === true;
          
          if (isDisabled) {
            return (
              <div
                key={tab.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed"
                title="この機能は現在メンテナンス中です"
              >
                <span>{tab.icon}</span>
                <div className="flex flex-col">
                  <span>{tab.label}</span>
                  <span className="text-xs">（メンテナンス中）</span>
                </div>
              </div>
            );
          }
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={(e) => handleNavClick(e, tab.href)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
        {(session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER") && (
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <Link
              href="/admin/dashboard"
              onClick={(e) => handleNavClick(e, "/admin/dashboard")}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname?.startsWith("/admin")
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              <span>📊</span>
              <span>オーガナイザー機能</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [hasCheckedDisplayName, setHasCheckedDisplayName] = useState(false);
  const [isPC, setIsPC] = useState(false);

  // PC判定
  useEffect(() => {
    const checkIsPC = () => {
      setIsPC(window.innerWidth >= 640); // sm breakpoint
    };

    checkIsPC();
    window.addEventListener("resize", checkIsPC);
    return () => window.removeEventListener("resize", checkIsPC);
  }, []);

  // /app配下のページを検索エンジンから除外
  useEffect(() => {
    if (typeof window === "undefined" || !document.head) {
      return;
    }

    // メタタグを削除せず、内容を変更する方法に変更（DOM削除によるエラーを回避）
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;

    if (pathname?.startsWith("/app")) {
      // noindexメタタグを追加または更新
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
    } else {
      // /app配下でない場合はメタタグの内容を変更（削除しない）
      if (metaRobots) {
        // デフォルトの内容に戻す（または削除したい場合は空文字列にする）
        // ただし、他のページで設定された内容を上書きしないよう注意
        // ここでは単に内容を変更するだけ
        metaRobots.setAttribute("content", "index, follow");
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
        <MobileHeader
          onMenuClick={() => setIsMenuOpen(true)}
          logoHref="/app/mypage"
          enableAutoHide={true}
        />
        <SideNav
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          showPCLogo={isPC}
          logoHref="/app/mypage"
          breakpoint="sm"
          width="56"
        >
          <AppSideNavContent
            onClose={() => setIsMenuOpen(false)}
          />
        </SideNav>
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
      <EmailRequiredBanner />
    </>
  );
}
