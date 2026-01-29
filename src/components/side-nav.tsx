"use client";

import Link from "next/link";
import Image from "next/image";
import { MenuController } from "@/components/menu-controller";

type SideNavProps = {
  isOpen: boolean;
  onClose: () => void;
  logoHref: string;
  children: React.ReactNode;
  breakpoint?: "sm" | "lg"; // ブレークポイント（sm: アプリ側、lg: 管理画面側）
  width?: "56" | "64"; // 幅（56: アプリ側、64: 管理画面側）
  showPCLogo?: boolean; // PC版でロゴを表示するか（管理画面側のみ）
};

export function SideNav({
  isOpen,
  onClose,
  logoHref,
  children,
  breakpoint = "sm",
  width = "56",
  showPCLogo = false,
}: SideNavProps) {
  const breakpointClass = breakpoint === "sm" ? "sm:" : "lg:";
  const widthClass = width === "56" ? "w-56" : "w-64";

  return (
    <>
      {/* オーバーレイ（モバイル版のみ） */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 ${breakpointClass}hidden`}
          onClick={onClose}
        />
      )}
      {/* サイドバー（PC版） */}
      <aside
        className={`hidden sm:block ${widthClass} flex-shrink-0 border-r border-zinc-200 bg-white ${breakpointClass}h-screen ${breakpointClass}sticky ${breakpointClass}top-0`}
      >
        <div className="flex h-full flex-col">
          {showPCLogo && (
            <div className="border-b border-zinc-200 p-4">
              <Link
                href={logoHref}
                className="flex items-center justify-center"
                onClick={onClose}
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
          )}
          {children}
        </div>
      </aside>
      {/* サイドバー（モバイル版） */}
      <aside
        className={`fixed top-0 left-0 z-50 flex ${widthClass} flex-col border-r border-zinc-100 bg-white px-4 py-6 transition-transform duration-300 ease-in-out ${breakpointClass}hidden overflow-y-auto ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{
          height: "100vh",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
        }}
      >
        {/* 閉じるボタン（モバイル版のみ） */}
        <div className={`mb-4 flex items-center justify-between ${breakpointClass}mb-6`}>
          <Link href={logoHref} className="flex items-center">
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
            onClick={onClose}
            className={`${breakpointClass}hidden`}
          />
        </div>
        {children}
      </aside>
    </>
  );
}
