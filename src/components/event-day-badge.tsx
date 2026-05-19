import { daysUntilEventJST } from "@/lib/date-utils";

interface EventDayBadgeProps {
  eventDateISO: string;
  eventEndDateISO?: string | null;
}

export function EventDayBadge({ eventDateISO, eventEndDateISO }: EventDayBadgeProps) {
  const days = daysUntilEventJST(eventDateISO);
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-rose/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-rose">
        本日開催
      </span>
    );
  }
  if (days > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-mint/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-mint">
        あと{days}日
      </span>
    );
  }
  // days < 0: 開始日が過去。複数日イベントで終了日が今日以降なら「開催中」
  if (eventEndDateISO && daysUntilEventJST(eventEndDateISO) >= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-400">
        開催中
      </span>
    );
  }
  return null;
}
