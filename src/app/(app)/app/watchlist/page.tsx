"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LinkCard } from "@/components/link-card";
import { EventsCardContent } from "@/components/events-card-content";
import { LoadingSpinner } from "@/components/loading-spinner";

type WatchlistEvent = {
  event: {
    id: string;
    name: string;
    theme: string | null;
    description: string | null;
    event_date: string;
    entry_start_at: string | null;
    payment_due_at: string | null;
    original_url: string;
    approval_status: string;
    tags: Array<{
      tag: {
        name: string;
      };
    }>;
  };
  followed_at: string;
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      const data = await res.json();
      setWatchlist(data);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleToggle = () => {
    // ウォッチリストから削除された場合、一覧を再取得
    fetchWatchlist();
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <header className="space-y-2">
              <Link
                href="/app/mypage"
                className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
              >
                ← マイページへ戻る
              </Link>
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  ウォッチリスト
                </h1>
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                  気になるイベントをまとめて管理します。ウォッチリストに追加したイベントの
                  エントリー開始日や支払期限などを一目で確認できます。
                </p>
              </div>
            </header>

            {watchlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 sm:p-6">
                <p className="text-xs text-zinc-700 sm:text-sm">
                  ウォッチリストに追加されたイベントはありません。
                  イベント一覧から「+」ボタンを押してイベントを追加してください。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item) => (
                  <LinkCard
                    key={item.event.id}
                    href={`/events/${item.event.id}`}
                    className="hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    cardClassName="rounded-3xl"
                  >
                    <EventsCardContent event={item.event} onToggle={handleToggle} />
                  </LinkCard>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

