"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { WatchlistButton } from "@/components/watchlist-button";
import { DateTime } from "@/components/date-time";
import { TagList } from "@/components/tag";
import { Button } from "@/components/button";
import { EventDayBadge } from "@/components/event-day-badge";

interface EventsCardContentProps {
    event: {
        id: string;
        name: string;
        description: string | null;
        event_date: string;
        event_end_date: string | null;
        is_multi_day: boolean;
        image_url: string | null;
        keywords: string[] | null;
        entries: Array<{
            entry_number: number;
            entry_start_at: string;
            entry_deadline_at: string;
            payment_due_at: string;
        }>;
        tags: Array<{
            tag: {
                name: string;
            };
        }>;
    };
    onToggle?: () => void;
}

export function EventsCardContent({ event, onToggle }: EventsCardContentProps) {
    const router = useRouter();

    const handleDetailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        router.push(`/events/${event.id}`);
    };

    const firstEntry = event.entries && event.entries.length > 0 ? event.entries[0] : null;

    const eventDateText = event.is_multi_day && event.event_end_date
        ? `${new Date(event.event_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} - ${new Date(event.event_end_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}`
        : new Date(event.event_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });

    const hasImage =
        typeof event.image_url === "string" && event.image_url.trim().length > 0;

    const keywordsOrTags =
        event.keywords && event.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
                {event.keywords.map((keyword, index) => (
                    <span
                        key={index}
                        className="inline-flex rounded-full bg-white/15 px-2 py-0.5 text-xs text-zinc-100 sm:bg-card-elevated sm:text-muted-foreground"
                    >
                        {keyword}
                    </span>
                ))}
            </div>
        ) : (
            <TagList
                tags={event.tags}
                className="gap-1 [&_span]:border-transparent [&_span]:bg-white/15 [&_span]:text-zinc-100 sm:[&_span]:bg-card-elevated sm:[&_span]:text-muted-foreground"
            />
        );

    return (
        <div className="relative -m-4 flex min-h-[220px] flex-col overflow-hidden rounded-3xl sm:m-0 sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:overflow-visible sm:rounded-none">
            <div
                className="absolute inset-0 sm:relative sm:inset-auto sm:aspect-video sm:h-auto sm:w-[44%] sm:min-w-[10.5rem] sm:max-w-[18rem] sm:shrink-0 sm:overflow-hidden sm:rounded-xl sm:bg-card-elevated sm:ring-1 sm:ring-border/50"
                aria-hidden
            >
                {hasImage ? (
                    <Image
                        src={event.image_url!.trim()}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 639px) 100vw, min(44vw, 18rem)"
                        unoptimized={event.image_url!.startsWith("http") || event.image_url!.startsWith("/api/")}
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-card-elevated" aria-hidden />
                        <Image
                            src="/images/main_logo_v2.svg"
                            alt=""
                            fill
                            className="object-contain opacity-95"
                            sizes="(max-width: 639px) 100vw, min(44vw, 18rem)"
                        />
                    </>
                )}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-black/60 sm:hidden" aria-hidden />

            <div className="pointer-events-none absolute right-2 top-2 z-20 sm:hidden">
                <div className="pointer-events-auto">
                    <WatchlistButton
                        eventId={event.id}
                        iconOnly
                        className="!h-8 !min-h-8 !w-8 !min-w-8 border-white/40"
                        onToggle={onToggle}
                    />
                </div>
            </div>

            <div className="relative z-10 flex min-h-[220px] flex-1 flex-col justify-end gap-4 p-4 pt-12 sm:min-h-0 sm:flex-row sm:items-center sm:justify-start sm:gap-4 sm:p-0 sm:pt-0">
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-mint">
                            {eventDateText}
                        </p>
                        <EventDayBadge eventDateISO={event.event_date} eventEndDateISO={event.event_end_date} />
                    </div>
                    <h2 className="text-lg font-semibold text-white sm:text-foreground">
                        {event.name}
                    </h2>
                    {event.description ? (
                        <p className="line-clamp-2 text-sm text-zinc-200 sm:text-muted-foreground">
                            {event.description}
                        </p>
                    ) : null}
                    {keywordsOrTags}
                </div>

                <div className="flex w-full min-w-0 flex-col items-start gap-2 text-xs text-zinc-300 sm:w-48 sm:text-muted">
                    {firstEntry ? (
                        <>
                            <div>
                                エントリー開始:{" "}
                                <span className="font-semibold text-zinc-100 sm:text-muted-foreground">
                                    <DateTime date={firstEntry.entry_start_at} format="month-day-short" size="xs" />
                                </span>
                            </div>
                            <div>
                                支払期限:{" "}
                                <span className="font-semibold text-zinc-100 sm:text-muted-foreground">
                                    <DateTime date={firstEntry.payment_due_at} format="month-day-short" size="xs" />
                                </span>
                            </div>
                        </>
                    ) : null}
                    {event.entries && event.entries.length > 1 ? (
                        <div className="text-xs text-zinc-400">
                            +{event.entries.length - 1}次エントリーあり
                        </div>
                    ) : null}
                    <div className="hidden w-full flex-col gap-2 sm:flex">
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
                            className="flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-card-elevated"
                            onToggle={onToggle}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
