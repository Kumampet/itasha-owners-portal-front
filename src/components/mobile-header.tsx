"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuController } from "@/components/menu-controller";

type MobileHeaderProps = {
  onMenuClick: () => void;
  logoHref: string;
  rightContent?: React.ReactNode;
  enableAutoHide?: boolean; // スクロール時の自動非表示機能を有効にするか
};

export function MobileHeader({
  onMenuClick,
  logoHref,
  rightContent,
  enableAutoHide = true,
}: MobileHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!enableAutoHide) {
      return;
    }

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
  }, [lastScrollY, enableAutoHide]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur transition-transform duration-300 ease-in-out sm:hidden safe-top ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      style={{
        paddingTop: `env(safe-area-inset-top, 0px)`,
        height: `calc(3.5rem + env(safe-area-inset-top, 0px))`,
        minHeight: `calc(3.5rem + env(safe-area-inset-top, 0px))`,
      }}
    >
      <MenuController
        variant="open"
        onClick={onMenuClick}
        className="h-10 w-10 border border-zinc-200 bg-white shadow-sm"
      />
      <Link href={logoHref} className="flex items-center">
        <Image
          src="/images/main_logo.png"
          alt="いたなび！痛車オーナーズナビ"
          width={150}
          height={60}
          className="h-8 w-auto"
          priority
        />
      </Link>
      {rightContent && <div className="flex items-center">{rightContent}</div>}
    </header>
  );
}
