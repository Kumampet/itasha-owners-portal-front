"use client";

import { useState, useEffect } from "react";
import { daysUntilEventJST } from "@/lib/date-utils";
interface EventDayBadgeProps {
  eventDateISO: string;
  eventEndDateISO?: string | null;
}

export function EventDayBadge({ eventDateISO, eventEndDateISO }: EventDayBadgeProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
     
    setIsMounted(true);
  }, []);

  // SSR時のHydration Mismatchを防ぐため、マウントされるまでは何も表示しない
  if (!isMounted) return null;

  const days = daysUntilEventJST(eventDateISO);

  const isToday = () => {
    if (eventEndDateISO) {
      const endDays = daysUntilEventJST(eventEndDateISO);
      // 開始日が今日以前 かつ 終了日が今日以降 なら開催期間中
      return days <= 0 && endDays >= 0;
    }
    return days === 0;
  };

  if (isToday()) {
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
