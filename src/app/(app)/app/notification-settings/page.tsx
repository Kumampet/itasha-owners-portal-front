"use client";

import { Suspense } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";

// TODO: 通知設定機能（プッシュ通知・メール通知）を削除しました。将来的に再実装する場合は、以下の機能を実装してください：
// - プッシュ通知の設定UI
// - メール通知の設定UI
// - 通知設定の保存・取得API
// - 通知設定チェック機能

function NotificationSettingsPageContent() {
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
              通知設定
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              通知設定機能は現在実装中です。
            </p>
          </div>
        </header>
      </section>
    </main>
  );
}

export default function NotificationSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1">
          <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </section>
        </main>
      }
    >
      <NotificationSettingsPageContent />
    </Suspense>
  );
}
