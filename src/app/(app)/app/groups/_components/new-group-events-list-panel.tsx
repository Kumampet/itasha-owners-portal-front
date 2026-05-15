"use client";

import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Pagination } from "@/components/pagination";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  event_date: string;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

interface NewGroupEventsListPanelProps {
  events: Event[];
  eventsLoading: boolean;
  pagination: PaginationData | null;
  onEventSelect: (eventId: string, event: Event) => void;
  onPageChange: (page: number) => void;
}

export function NewGroupEventsListPanel({
  events,
  eventsLoading,
  pagination,
  onEventSelect,
  onPageChange,
}: NewGroupEventsListPanelProps) {
  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        イベントが見つかりません
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {events.map((event) => (
          <Button
            key={event.id}
            variant="secondary"
            size="md"
            rounded="md"
            fullWidth
            onClick={() => onEventSelect(event.id, event)}
            className="p-4 text-left justify-start hover:border-accent-mint/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {event.name}
                </p>
                {event.theme && (
                  <p className="mt-1 text-xs text-muted">
                    {event.theme}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {new Date(event.event_date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="text-xs font-semibold text-accent-mint">
                選択 →
              </span>
            </div>
          </Button>
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
