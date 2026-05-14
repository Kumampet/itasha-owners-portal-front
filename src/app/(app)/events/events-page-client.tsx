"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageFromUrl = useMemo(() => {
    const raw = searchParams.get("page");
    const n = parseInt(raw ?? "1", 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return n;
  }, [searchParams]);

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [prefectureFilter, setPrefectureFilter] = useState("");
  const [eventYearMonth, setEventYearMonth] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const hasActiveFilters =
    searchQuery.trim() !== "" || Boolean(prefectureFilter) || Boolean(eventYearMonth);

  const navigateToPage = useCallback(
    (page: number, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "replace") {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: true });
      }
    },
    [router, pathname, searchParams]
  );

  const resetPageInUrl = useCallback(() => {
    if (!searchParams.has("page")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageFromUrl.toString());
      params.append("limit", String(pageSize));
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (prefectureFilter) {
        params.append("prefecture", prefectureFilter);
      }
      if (eventYearMonth) {
        params.append("yearMonth", eventYearMonth);
      }
      params.append("sortOrder", sortOrder);

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
    pageSize,
    searchQuery,
    prefectureFilter,
    eventYearMonth,
    sortOrder,
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
    resetPageInUrl();
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setPrefectureFilter("");
    setEventYearMonth("");
    resetPageInUrl();
  }, [resetPageInUrl]);

  return (
    <>
      <EventsFilterPanel
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        prefecture={prefectureFilter}
        onPrefectureChange={(v) => {
          setPrefectureFilter(v);
          resetPageInUrl();
        }}
        eventYearMonth={eventYearMonth}
        onEventYearMonthChange={(v) => {
          setEventYearMonth(v);
          resetPageInUrl();
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(v) => {
          setSortOrder(v);
          resetPageInUrl();
        }}
        pageSize={pageSize}
        onPageSizeChange={(v) => {
          setPageSize(v);
          resetPageInUrl();
        }}
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
