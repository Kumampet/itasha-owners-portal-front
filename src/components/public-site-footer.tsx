import Link from "next/link";

/**
 * ランディング等の公開ページ用フッター（ポリシー・問い合わせへの明確な導線）
 */
export function PublicSiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-10 text-sm text-zinc-600">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <nav
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
          aria-label="サイト情報"
        >
          <Link href="/term" className="underline-offset-2 hover:text-zinc-900 hover:underline">
            利用規約
          </Link>
          <Link
            href="/privacy-policy"
            className="underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/app/contact"
            className="underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            お問い合わせ
          </Link>
          <Link href="/events" className="underline-offset-2 hover:text-zinc-900 hover:underline">
            イベント一覧
          </Link>
        </nav>
        <p className="text-xs text-zinc-500 sm:text-right">
          運営：痛車オーナーズナビ（いたなび！）
        </p>
      </div>
    </footer>
  );
}
