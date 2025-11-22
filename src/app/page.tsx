import { DbEventsPreview } from "@/components/db-events-preview";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:pt-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-4">
            <p className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 sm:text-sm">
              痛車イベントの「併せ」と「締切」、XのDM制限から解放されるためのツール
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              痛車イベントの予定と併せ管理を、<br className="hidden sm:block" />
              1つのアプリで完結。
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
              「エントリー開始日」「支払い期限」「集合時間」…。
              SNSのタイムラインに流されてしまう情報を、痛車オーナー向けに最適化された
              PWAでまとめて管理できます。
            </p>
            <ul className="space-y-2 text-sm text-zinc-700 sm:text-base">
              <li>・イベントごとのエントリー開始・締切を自動でリマインド</li>
              <li>・団体参加（併せ）のメンバー募集と一斉連絡をメールで確実に通知</li>
              <li>・フォロー/いいね/ランキングのない、穏やかな情報プラットフォーム</li>
            </ul>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button className="h-11 rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-zinc-800">
                無料ではじめる（メールアドレスで登録）
              </button>
              <button className="h-11 rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
                まずは機能を詳しく見る
              </button>
            </div>
          </div>
          <div className="mt-4 w-full max-w-sm self-stretch rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:mt-0 sm:w-80">
            <p className="text-xs font-medium text-zinc-500">
              モバイル画面イメージ
            </p>
            <div className="mt-3 space-y-3 text-xs">
              <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-zinc-50">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Today
                </p>
                <p className="mt-1 text-sm font-semibold">
                  痛車天国 in お台場 2025
                </p>
                <p className="text-[11px] text-zinc-300">
                  エントリー支払期限まで あと 3 日
                </p>
                <p className="mt-1 text-[11px] text-emerald-300">
                  併せ「レトロスポーツ痛車会」メンバーに一斉連絡を送信予定
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-[11px] font-medium text-zinc-600">
                  直近のリマインダー
                </p>
                <ul className="mt-1 space-y-1 text-[11px] text-zinc-700">
                  <li>・12/01 痛Gふぇすた – エントリー開始</li>
                  <li>・12/05 痛車ミーティング – 併せメンバー確定〆切</li>
                  <li>・12/10 イベント参加費支払期限</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 rounded-3xl bg-zinc-50 p-5 sm:grid-cols-3 sm:gap-6 sm:p-8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              期限管理のストレスをゼロに
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">
              イベントのエントリー開始・締切・支払期限を1つのタイムラインで確認。
              重要なタイミングはプッシュ通知とメールで事前にお知らせします。
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              XのDM制限に依存しない併せ管理
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">
              団体チャットの一斉連絡はメール通知が必須。
              DM制限やアカウント凍結に左右されない、安心できる連絡手段を提供します。
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              競争のない、静かな情報プラットフォーム
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">
              フォロー/フォロワー、いいね、ランキングといった
              SNS的な機能はあえて搭載しません。痛車活動を気楽に続けるための
              インフラとして設計されています。
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-dashed border-zinc-300 bg-white p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
            今後のロードマップ
          </h2>
          <ul className="space-y-2 text-xs text-zinc-700 sm:text-sm">
            <li>
              <span className="font-semibold">Phase 1:</span>{" "}
              PWA/リマインダー、管理者向けCMS、マイページの提供
            </li>
            <li>
              <span className="font-semibold">Phase 2:</span>{" "}
              団体機能・検索機能・公開プロフィール・更新検知ボット
            </li>
            <li>
              <span className="font-semibold">Phase 3–4:</span>{" "}
              オーガナイザー向け機能とネイティブアプリ化の検討
            </li>
          </ul>
        </section>

        <DbEventsPreview />
      </section>
    </main>
  );
}
