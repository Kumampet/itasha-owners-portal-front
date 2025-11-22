import Link from "next/link";

export default function GroupsPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              団体（併せ）管理
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              イベントごとの団体参加（併せ）のメンバー募集・参加状況・一斉連絡を
              管理する画面です。
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              併せ一覧
            </h2>
            <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
              まだ団体は登録されていません。将来的には、参加予定イベントごとに
              作成した併せがここに表示されます。
            </p>
          </section>

          <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              一斉連絡ポリシー
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-zinc-700 sm:text-sm">
              <li>・団体メッセージで「一斉連絡」として投稿されたものは必ずメール通知。</li>
              <li>・プッシュ通知は補助として利用し、メール未達のリスクを前提に設計。</li>
              <li>・メールのオプトアウト・バウンス率監視はSES側で実装予定。</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

