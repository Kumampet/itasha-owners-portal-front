"use client";

import { useState, type FormEvent } from "react";

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

type EventsFilterPanelProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function EventsFilterPanel({
  searchQuery,
  onSearchQueryChange,
  sortOrder,
  onSortOrderChange,
  pageSize,
  onPageSizeChange,
  onSubmit,
}: EventsFilterPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const summaryLine = [
    searchQuery.trim() ? `「${truncateMiddleHint(searchQuery, 14)}」` : null,
    SORT_LABELS[sortOrder],
    `${pageSize}件`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        aria-controls="events-filters-form-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-left transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:hidden"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-zinc-800">検索・表示条件</span>
          {!panelOpen ? (
            <span className="truncate text-xs text-zinc-500" title={summaryLine}>
              {summaryLine}
            </span>
          ) : null}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${panelOpen ? "rotate-180" : ""}`}
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
          <div className="flex flex-1 flex-col gap-3 min-w-0 sm:flex-row sm:items-end sm:gap-4">
            <div className="w-full min-w-0 flex-1">
              <label htmlFor="search" className="mb-1 block text-sm font-medium text-zinc-700">
                検索
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="イベント名、説明、開催地などで検索"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="w-full shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 sm:w-auto"
            >
              検索
            </button>
          </div>

          <div
            className="h-px w-full shrink-0 bg-zinc-200 sm:h-10 sm:w-px sm:self-end"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <div className="sm:w-48">
              <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-zinc-700">
                表示順
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => onSortOrderChange(e.target.value as "asc" | "desc")}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="asc">{SORT_LABELS.asc}</option>
                <option value="desc">{SORT_LABELS.desc}</option>
              </select>
            </div>
            <div className="sm:w-36">
              <label htmlFor="pageSize" className="mb-1 block text-sm font-medium text-zinc-700">
                表示件数
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
