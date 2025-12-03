"use client";

import { useEffect, useState, useCallback } from "react";
import { LinkCard } from "@/components/link-card";
import { EventsCardContent } from "@/components/events-card-content";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Pagination } from "@/components/pagination";

type DbEvent = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  is_multi_day: boolean;
  official_urls: string[];
  keywords: string[] | null;
  image_url: string | null;
  approval_status: string;
  entries: Array<{
    entry_number: number;
    entry_start_at: string;
    entry_start_public_at: string | null;
    entry_deadline_at: string;
    payment_due_at: string;
    payment_due_public_at: string | null;
  }>;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

export default function EventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.events || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, sortOrder]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 検索時は1ページ目に戻る
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as "asc" | "desc");
    setCurrentPage(1); // ソート変更時は1ページ目に戻る
  };

  return (
    <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            イベントカレンダー
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            痛車イベントをまとめてチェック
          </h1>
          <p className="text-sm text-zinc-600 sm:text-base">
            気になるイベントを一気にチェック！<br />ウォッチリストに入れておくと最新情報を逃しません。
          </p>
        </header>

        {/* 検索とフィルター */}
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-zinc-700 mb-1">
                検索
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="イベント名、説明、開催地などで検索"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="sortOrder" className="block text-sm font-medium text-zinc-700 mb-1">
                表示順
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={handleSortChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="asc">開催日が近い順</option>
                <option value="desc">開催日が遠い順</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            >
              検索
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  {searchQuery ? "検索条件に一致するイベントが見つかりませんでした。" : "イベントが登録されていません。"}
                </p>
              ) : (
                events.map((event) => (
                  <LinkCard
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    cardClassName="rounded-3xl"
                  >
                    <EventsCardContent event={event} />
                  </LinkCard>
                ))
              )}
            </div>

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

