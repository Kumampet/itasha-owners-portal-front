"use client";

import Link from "next/link";
import { usePwaBannerInset } from "@/contexts/pwa-banner-inset-context";

/**
 * 下端の PWA 誘導バナーの高さぶんだけ `paddingBottom` が増える（{@link PwaBannerInsetProvider}）。
 */
export function PublicSiteFooter() {
  const { footerInsetPx } = usePwaBannerInset();

  const paddingBottom = `calc(2.5rem + ${footerInsetPx}px)`;

  return (
    <footer
      className="border-t border-border bg-card pt-10 text-sm text-muted-foreground"
      style={{
        paddingBottom,
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <nav
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
          aria-label="サイト情報"
        >
          <Link
            href="/term"
            className="underline-offset-2 hover:text-accent-rose hover:underline"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="underline-offset-2 hover:text-accent-rose hover:underline"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/app/contact"
            className="underline-offset-2 hover:text-accent-mint hover:underline"
          >
            お問い合わせ
          </Link>
          <Link href="/events" className="underline-offset-2 hover:text-accent-mint hover:underline">
            イベント一覧
          </Link>
        </nav>
        <p className="text-xs text-muted sm:text-right">
          運営：Kumampet（いたなび！）
        </p>
      </div>
    </footer>
  );
}
