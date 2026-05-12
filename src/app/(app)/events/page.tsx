import { Suspense } from "react";
import EventsPageClient from "./events-page-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function EventsPage() {
  return (
    <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint">
            イベントカレンダー
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            痛車イベントをまとめてチェック
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            気になるイベントを一気にチェック！<br />ウォッチリストに入れておくと最新情報を逃しません。
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <EventsPageClient />
        </Suspense>
      </section>
    </main>
  );
}
