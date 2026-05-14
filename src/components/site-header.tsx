"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { MenuController } from "@/components/menu-controller";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  SITE_NAV_ITEMS,
  SITE_NAV_ORGANIZER_ITEM,
  resolveSiteNavActiveKey,
} from "@/config/site-nav";
import { SiteNavDrawerIcon } from "@/components/site-nav-drawer-icons";

function useBodyScrollLock(lock: boolean) {
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;
    if (lock) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lock]);
}

function CompactHeaderAuth({
  placement = "header",
  onDismiss,
}: {
  placement?: "header" | "drawer";
  onDismiss?: () => void;
}) {
  const { data: session, status } = useSession();

  const displayName =
    session?.user?.displayName ||
    session?.user?.name ||
    session?.user?.email ||
    "ユーザー";

  const isDrawer = placement === "drawer";

  const accountLinkClass = isDrawer
    ? "flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card-elevated py-1 pl-1 pr-2 text-xs text-foreground transition hover:border-accent-mint/35"
    : "flex min-w-0 items-center gap-2 rounded-full border border-border bg-card-elevated py-1 pl-1 pr-2 text-xs text-foreground transition hover:border-accent-mint/35";

  if (status === "loading") {
    return (
      <div className={`flex items-center px-2${isDrawer ? " w-full" : ""}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div
        className={
          isDrawer
            ? "flex w-full min-w-0 items-center justify-between gap-2"
            : "flex items-center gap-2"
        }
      >
        <Link
          href="/app/mypage"
          className={accountLinkClass}
          onClick={() => onDismiss?.()}
          aria-label={`マイページへ（アカウント：${displayName}）`}
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full ring-1 ring-accent-rose/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-mint/20 text-[10px] font-medium text-accent-mint">
              名
            </span>
          )}
          <span
            className={
              isDrawer
                ? "min-w-0 flex-1 truncate text-sm font-semibold text-accent-mint"
                : "whitespace-nowrap font-medium sm:text-sm"
            }
          >
            マイページ
          </span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            onDismiss?.();
            await signOut({ redirect: false });
            window.location.href = "/app/auth";
          }}
          className="shrink-0 whitespace-nowrap rounded-md border border-accent-rose/35 bg-accent-rose/10 px-2 py-1 text-[11px] text-accent-rose transition hover:bg-accent-rose/15"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/app/auth"
      onClick={() => onDismiss?.()}
      className="inline-flex items-center justify-center rounded-full bg-accent-mint px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm transition hover:brightness-110"
    >
      ログイン
    </Link>
  );
}

type SiteHeaderProps = {
  /**
   * 認証ページ等で、ログインボタン・アカウントメニュー（ドロワー先頭の同一 UI）のみ非表示。
   * サイト内ナビとモバイルのメニュー開閉はそのまま表示する。
   */
  hideAuthUi?: boolean;
};

export function SiteHeader({ hideAuthUi = false }: SiteHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname() || "/";
  const { data: session } = useSession();
  const activeKey = resolveSiteNavActiveKey(pathname);

  useBodyScrollLock(drawerOpen);

  const navItems = SITE_NAV_ITEMS;
  const organizerNav = SITE_NAV_ORGANIZER_ITEM;
  const showOrganizerNav =
    session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER";
  const organizerActive = activeKey === organizerNav.key;

  const navInactive =
    "text-muted-foreground hover:bg-card-elevated hover:text-foreground";
  const navActive =
    "border border-accent-mint/35 bg-accent-mint/15 text-accent-mint";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 safe-top">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-14 sm:px-6 lg:gap-8">
          <Link href="/" className="h-full min-w-0 shrink-0 lg:mr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/itanavi_logo_small_bg_alpha.svg"
              alt="いたなび！痛車オーナーズナビ"
              className="h-full"
            />
          </Link>

          <nav
            className="hidden lg:flex lg:flex-1 lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-2 lg:gap-y-2 xl:gap-x-3"
            aria-label="サイト内の主要ページ"
          >
            {navItems.map((tab) => {
              const isActive = tab.key === activeKey;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition xl:text-sm ${isActive ? navActive : navInactive
                    }`}
                >
                  {tab.label}
                </Link>
              );
            })}
            {showOrganizerNav && (
              <Link
                href={organizerNav.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium xl:text-sm ${organizerActive ? navActive : navInactive
                  }`}
              >
                {organizerNav.label}
              </Link>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {!hideAuthUi && (
              <div className="hidden lg:flex">
                <CompactHeaderAuth placement="header" />
              </div>
            )}
            <div className="lg:hidden">
              <MenuController
                variant="open"
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card shadow-sm shadow-black/20"
              />
            </div>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-[70] flex w-[min(20rem,calc(100vw-3rem))] flex-col border-l border-border bg-card shadow-2xl shadow-black/40 transition-transform duration-300 ease-out lg:hidden safe-top safe-bottom ${drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 pb-3">
          <MenuController variant="close" onClick={() => setDrawerOpen(false)} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!hideAuthUi && (
            <div className="mb-6">
              <CompactHeaderAuth
                placement="drawer"
                onDismiss={() => setDrawerOpen(false)}
              />
            </div>
          )}
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((tab) => {
              const isActive = tab.key === activeKey;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive
                    ? "border border-accent-mint/30 bg-accent-mint/15 text-accent-mint"
                    : "text-muted-foreground hover:bg-card-elevated hover:text-foreground"
                    }`}
                >
                  <SiteNavDrawerIcon icon={tab.icon} active={isActive} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            {showOrganizerNav && (
              <Link
                href={organizerNav.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${organizerActive
                  ? "border border-accent-mint/30 bg-accent-mint/15 text-accent-mint"
                  : "text-muted-foreground hover:bg-card-elevated hover:text-foreground"
                  }`}
              >
                <SiteNavDrawerIcon
                  icon={organizerNav.icon}
                  active={organizerActive}
                />
                <span>{organizerNav.label}</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
