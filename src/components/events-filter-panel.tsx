"use client";

import { useMemo, useState, type FormEvent } from "react";
import { JAPAN_PREFECTURES } from "@/lib/japan-prefectures";
import { buildEventYearMonthOptions } from "@/lib/event-year-month-options";

export const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const SORT_LABELS = {
  asc: "開催日が近い順",
  desc: "開催日が遠い順",
} as const;

function truncateMiddleHint(text: string, maxChars: number) {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars)}…`;
}

function formatYearMonthJa(ym: string) {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!ys || !ms || !Number.isFinite(y) || !Number.isFinite(m)) return ym;
  return `${y}年${m}月`;
}

type EventsFilterPanelProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  prefecture: string;
  onPrefectureChange: (value: string) => void;
  eventYearMonth: string;
  onEventYearMonthChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
};

export function EventsFilterPanel({
  searchQuery,
  onSearchQueryChange,
  prefecture,
  onPrefectureChange,
  eventYearMonth,
  onEventYearMonthChange,
  sortOrder,
  onSortOrderChange,
  pageSize,
  onPageSizeChange,
  onSubmit,
  onClearFilters,
}: EventsFilterPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const hasFilterQuery =
    searchQuery.trim() !== "" || Boolean(prefecture) || Boolean(eventYearMonth);

  const yearMonthOptions = useMemo(
    () => buildEventYearMonthOptions(new Date(), eventYearMonth || undefined),
    [eventYearMonth]
  );

  const summaryLine = [
    searchQuery.trim() ? `「${truncateMiddleHint(searchQuery, 14)}」` : null,
    prefecture || null,
    eventYearMonth ? formatYearMonthJa(eventYearMonth) : null,
    SORT_LABELS[sortOrder],
    `${pageSize}件`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        aria-controls="events-filters-form-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border bg-card-elevated/80 px-4 py-3 text-left transition hover:bg-card-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:hidden"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">検索・表示条件</span>
          {!panelOpen ? (
            <span className="truncate text-xs text-muted" title={summaryLine}>
              {summaryLine}
            </span>
          ) : null}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-muted transition-transform ${panelOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        id="events-filters-form-panel"
        className={`p-4 sm:block ${panelOpen ? "" : "max-sm:hidden"}`}
      >
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3">
            <div className="w-full min-w-0 sm:min-w-[12rem] sm:flex-1 sm:max-w-md">
              <label htmlFor="search" className="mb-1 block text-sm font-medium text-muted-foreground">
                検索
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="イベント名、説明、開催地などで検索"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              />
            </div>
            <div className="flex w-full min-w-0 flex-row gap-3 sm:w-auto sm:shrink-0">
              <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
                <label htmlFor="prefecture-filter" className="mb-1 block text-sm font-medium text-muted-foreground">
                  会場の都道府県
                </label>
                <select
                  id="prefecture-filter"
                  value={prefecture}
                  onChange={(e) => onPrefectureChange(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
                >
                  <option value="">指定なし</option>
                  {JAPAN_PREFECTURES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                <label htmlFor="event-year-month" className="mb-1 block text-sm font-medium text-muted-foreground">
                  開催年月
                </label>
                <select
                  id="event-year-month"
                  value={eventYearMonth}
                  onChange={(e) => onEventYearMonthChange(e.target.value)}
                  title="イベントの開始日が含まれる月で絞り込みます"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
                >
                  <option value="">指定なし</option>
                  {yearMonthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-row gap-2 sm:w-auto">
              <button
                type="submit"
                className="min-w-0 flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 sm:flex-none sm:w-auto"
              >
                検索
              </button>
              <button
                type="button"
                disabled={!hasFilterQuery}
                onClick={onClearFilters}
                className="min-w-0 flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-card-elevated focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:flex-none sm:w-auto"
              >
                フィルターをクリア
              </button>
            </div>
          </div>

          <div
            className="h-px w-full shrink-0 bg-zinc-200 sm:h-10 sm:w-px sm:self-end"
            aria-hidden="true"
          />

          <div className="flex w-full min-w-0 flex-row gap-3 sm:w-auto sm:shrink-0 sm:gap-4">
            <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
              <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-muted-foreground">
                表示順
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => onSortOrderChange(e.target.value as "asc" | "desc")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              >
                <option value="asc">{SORT_LABELS.asc}</option>
                <option value="desc">{SORT_LABELS.desc}</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
              <label htmlFor="pageSize" className="mb-1 block text-sm font-medium text-muted-foreground">
                表示件数
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}件
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
