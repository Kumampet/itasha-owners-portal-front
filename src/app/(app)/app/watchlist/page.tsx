"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WatchlistButton } from "@/components/watchlist-button";

type WatchlistEvent = {
  event: {
    id: string;
    name: string;
    theme: string | null;
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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(dateString));
}

function formatDateShort(dateString: string | null) {
  if (!dateString) return "未定";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

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

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
          </div>
        </section>
      </main>
    );
  }

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
              ウォッチリスト
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              気になるイベントをまとめて管理します。ウォッチリストに追加したイベントの
              エントリー開始日や支払期限などのリマインダーが自動的に設定されます。
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
              <article
                key={item.event.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4 ring-offset-white transition hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {formatDate(item.event.event_date)}
                    </p>
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {item.event.name}
                      </h2>
                      {item.event.theme && (
                        <p className="text-sm text-zinc-600">{item.event.theme}</p>
                      )}
                    </div>
                    {item.event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.event.tags.map((eventTag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {eventTag.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:w-48">
                    {item.event.entry_start_at && (
                      <div>
                        エントリー開始:{" "}
                        <span className="font-semibold text-zinc-700">
                          {formatDateShort(item.event.entry_start_at)}
                        </span>
                      </div>
                    )}
                    {item.event.payment_due_at && (
                      <div>
                        支払期限:{" "}
                        <span className="font-semibold text-zinc-700">
                          {formatDateShort(item.event.payment_due_at)}
                        </span>
                      </div>
                    )}
                    <div className="flex w-full flex-col gap-2">
                      <Link
                        href={`/events/${item.event.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        詳細
                      </Link>
                      <WatchlistButton
                        eventId={item.event.id}
                        className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        onToggle={handleToggle}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

