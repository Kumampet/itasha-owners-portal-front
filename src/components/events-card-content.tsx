"use client";

import { useRouter } from "next/navigation";
import { WatchlistButton } from "@/components/watchlist-button";
import { DateTime } from "@/components/date-time";
import { TagList } from "@/components/tag";
import { Button } from "@/components/button";

interface EventsCardContentProps {
    event: {
        id: string;
        name: string;
        theme: string | null;
        description: string | null;
        event_date: string;
        entry_start_at: string | null;
        payment_due_at: string | null;
        tags: Array<{
            tag: {
                name: string;
            };
        }>;
    };
}

export function EventsCardContent({ event }: EventsCardContentProps) {
    const router = useRouter();

    const handleDetailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        router.push(`/events/${event.id}`);
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    <DateTime date={event.event_date} format="weekday-short" size="xs" />
                </p>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                        {event.name}
                    </h2>
                    {event.theme && (
                        <p className="text-sm text-zinc-600">{event.theme}</p>
                    )}
                </div>
                {event.description && (
                    <p className="text-sm text-zinc-700">{event.description}</p>
                )}
                <TagList tags={event.tags} />
            </div>
            <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:w-48">
                {event.entry_start_at && (
                    <div>
                        エントリー開始:{" "}
                        <span className="font-semibold text-zinc-700">
                            <DateTime date={event.entry_start_at} format="month-day-short" size="xs" />
                        </span>
                    </div>
                )}
                {event.payment_due_at && (
                    <div>
                        支払期限:{" "}
                        <span className="font-semibold text-zinc-700">
                            <DateTime date={event.payment_due_at} format="month-day-short" size="xs" />
                        </span>
                    </div>
                )}
                <div className="flex w-full flex-col gap-2">
                    <Button
                        variant="primary"
                        size="md"
                        rounded="full"
                        fullWidth
                        onClick={handleDetailClick}
                    >
                        詳細
                    </Button>
                    <WatchlistButton
                        eventId={event.id}
                        className="w-full flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    />
                </div>
            </div>
        </div>
    );
}

