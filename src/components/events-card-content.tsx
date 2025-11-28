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
        description: string | null;
        event_date: string;
        event_end_date: string | null;
        is_multi_day: boolean;
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

    // 最初のエントリー（1次エントリー）を取得
    const firstEntry = event.entries && event.entries.length > 0 ? event.entries[0] : null;

    // 開催日表示用のテキスト
    const eventDateText = event.is_multi_day && event.event_end_date
        ? `${new Date(event.event_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} - ${new Date(event.event_end_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}`
        : new Date(event.event_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {eventDateText}
                </p>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                        {event.name}
                    </h2>
                </div>
                {event.description && (
                    <p className="text-sm text-zinc-700 line-clamp-2">{event.description}</p>
                )}
                {/* キーワードまたはタグを表示 */}
                {event.keywords && event.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {event.keywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                ) : (
                    <TagList tags={event.tags} />
                )}
            </div>
            <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:w-48">
                {firstEntry && (
                    <>
                        <div>
                            エントリー開始:{" "}
                            <span className="font-semibold text-zinc-700">
                                <DateTime date={firstEntry.entry_start_at} format="month-day-short" size="xs" />
                            </span>
                        </div>
                        <div>
                            支払期限:{" "}
                            <span className="font-semibold text-zinc-700">
                                <DateTime date={firstEntry.payment_due_at} format="month-day-short" size="xs" />
                            </span>
                        </div>
                    </>
                )}
                {event.entries && event.entries.length > 1 && (
                    <div className="text-xs text-zinc-400">
                        +{event.entries.length - 1}次エントリーあり
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
                        onToggle={onToggle}
                    />
                </div>
            </div>
        </div>
    );
}

