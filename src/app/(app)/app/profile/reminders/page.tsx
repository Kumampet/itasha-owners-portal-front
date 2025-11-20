import Link from "next/link";

export default function ProfileRemindersPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/profile"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              リマインダー
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              エントリー開始日・締切・支払期限・集合時間など、イベントごとの重要な
              タイミングをまとめて管理する画面です。
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 sm:p-6">
          <p className="text-xs text-zinc-700 sm:text-sm">
            まだバックエンドと連携していないため、ダミー状態です。
            後続フェーズでRDS PostgreSQLと接続し、ユーザーごとの
            リマインダー一覧をここに表示します。
          </p>
        </div>
      </section>
    </main>
  );
}


