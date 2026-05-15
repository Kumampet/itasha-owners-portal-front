"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkCard } from "@/components/link-card";
import {
  EventsFilterPanel,
  type PageSize,
} from "@/components/events-filter-panel";
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

export default function EventsPageClient() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** useSearchParams の参照が毎レンダーで変わるとコールバックが再生成され fetch が連鎖するため、クエリ文字列で安定化する */
  const searchParamsSnapshot = searchParams.toString();

  const pageFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchParamsSnapshot);
    const raw = params.get("page");
    const n = parseInt(raw ?? "1", 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return n;
  }, [searchParamsSnapshot]);

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  /** フォーム上の値（検索ボタンまで API に反映しない） */
  const [searchQuery, setSearchQuery] = useState("");
  const [prefectureFilter, setPrefectureFilter] = useState("");
  const [eventYearMonth, setEventYearMonth] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<PageSize>(10);
  /** 最後に検索で確定した条件（fetch に使う） */
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedPrefectureFilter, setAppliedPrefectureFilter] = useState("");
  const [appliedEventYearMonth, setAppliedEventYearMonth] = useState("");
  const [appliedSortOrder, setAppliedSortOrder] = useState<"asc" | "desc">("asc");
  const [appliedPageSize, setAppliedPageSize] = useState<PageSize>(10);

  const hasActiveFilters =
    appliedSearchQuery.trim() !== "" ||
    Boolean(appliedPrefectureFilter) ||
    Boolean(appliedEventYearMonth);

  const navigateToPage = useCallback(
    (page: number, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParamsSnapshot);
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      const r = routerRef.current;
      if (mode === "replace") {
        r.replace(url, { scroll: false });
      } else {
        r.push(url, { scroll: true });
      }
    },
    [pathname, searchParamsSnapshot]
  );

  const resetPageInUrl = useCallback(() => {
    const params = new URLSearchParams(searchParamsSnapshot);
    if (!params.has("page")) return;
    params.delete("page");
    const qs = params.toString();
    routerRef.current.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, searchParamsSnapshot]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageFromUrl.toString());
      params.append("limit", String(appliedPageSize));
      if (appliedSearchQuery) {
        params.append("search", appliedSearchQuery);
      }
      if (appliedPrefectureFilter) {
        params.append("prefecture", appliedPrefectureFilter);
      }
      if (appliedEventYearMonth) {
        params.append("yearMonth", appliedEventYearMonth);
      }
      params.append("sortOrder", appliedSortOrder);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch events:", res.status, data);
        throw new Error("Failed to fetch events");
      }
      const pag = data.pagination as PaginationData | null | undefined;

      if (pag && pag.totalPages > 0 && pageFromUrl > pag.totalPages) {
        navigateToPage(pag.totalPages, "replace");
        return;
      }
      if (pag && pag.totalCount === 0 && pageFromUrl > 1) {
        resetPageInUrl();
        return;
      }

      setEvents(data.events || []);
      setPagination(pag ?? null);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, [
    pageFromUrl,
    appliedPageSize,
    appliedSearchQuery,
    appliedPrefectureFilter,
    appliedEventYearMonth,
    appliedSortOrder,
    navigateToPage,
    resetPageInUrl,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    document.title = "イベント一覧 | 痛車オーナーズナビ | いたなび！";
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppliedSearchQuery(searchQuery.trim());
    setAppliedPrefectureFilter(prefectureFilter);
    setAppliedEventYearMonth(eventYearMonth);
    setAppliedSortOrder(sortOrder);
    setAppliedPageSize(pageSize);
    resetPageInUrl();
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setPrefectureFilter("");
    setEventYearMonth("");
    setAppliedSearchQuery("");
    setAppliedPrefectureFilter("");
    setAppliedEventYearMonth("");
    resetPageInUrl();
  }, [resetPageInUrl]);

  return (
    <>
      <EventsFilterPanel
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        prefecture={prefectureFilter}
        onPrefectureChange={setPrefectureFilter}
        eventYearMonth={eventYearMonth}
        onEventYearMonthChange={setEventYearMonth}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onSubmit={handleSearch}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? "検索条件に一致するイベントが見つかりませんでした。" : "イベントが登録されていません。"}
              </p>
            ) : (
              events.map((event) => (
                <LinkCard
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-mint"
                  cardClassName="rounded-3xl overflow-hidden"
                >
                  <EventsCardContent event={event} />
                </LinkCard>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(p) => navigateToPage(p, "push")}
            />
          )}
        </>
      )}
    </>
  );
}
