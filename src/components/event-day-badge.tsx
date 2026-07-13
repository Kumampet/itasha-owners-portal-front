import { daysUntilEventJST } from "@/lib/date-utils";

interface EventDayBadgeProps {
  eventDateISO: string;
  eventEndDateISO?: string | null;
}

export function EventDayBadge({ eventDateISO, eventEndDateISO }: EventDayBadgeProps) {
  const days = daysUntilEventJST(eventDateISO);
  if (days === 0 || (eventEndDateISO && daysUntilEventJST(eventEndDateISO) >= 0)) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-rose/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-rose">
        本日開催
      </span>
    );
  }
  if (days > 0 && days <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-mint/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-mint">
        あと{days}日
      </span>
    );
  }
  return null;
}
