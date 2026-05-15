"use client";

import { usePathname } from "next/navigation";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

/**
 * 管理画面ではバナーを出さない。その他すべてのページで共通のモバイル PWA 導線を表示する。
 */
export function ConditionalPWAInstallBanner() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return null;

  return <PWAInstallBanner />;
}
