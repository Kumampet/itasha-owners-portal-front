"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: "/app", label: "ホーム", key: "app" },
  { href: "/app/events", label: "イベント", key: "events" },
  { href: "/app/profile", label: "マイページ", key: "profile" },
];

function resolveActiveKey(pathname: string) {
  const normalized = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) return "";
  if (segments[0] === "app" && segments.length > 1) {
    return segments[1];
  }
  return segments[0];
}

function BottomTabBar() {
  const pathname = usePathname();
  const activeKey = resolveActiveKey(pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 px-2 py-2.5 backdrop-blur sm:hidden">
      <ul className="flex items-center justify-between text-[11px]">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey || (tab.key === "app" && activeKey === "app");
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
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
  const activeKey = resolveActiveKey(pathname);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 border-r border-zinc-100 bg-white px-4 py-6 sm:flex sm:flex-col">
      <div className="mb-6 text-sm font-semibold text-zinc-900">
        痛車オーナーズポータル
      </div>
      <nav className="space-y-1 text-sm">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey || (tab.key === "app" && activeKey === "app");
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
