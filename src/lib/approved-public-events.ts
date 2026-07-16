import type { Prisma } from "@prisma/client";
import { startOfTodayJST } from "@/lib/date-utils";
import { events } from "@/db/schema";
import { and, or, eq, gte, isNull, isNotNull } from "drizzle-orm";

/** 一覧 API と同様、公開中かつ「まだ終了していない」承認済みイベント。
 *  JST の当日開始を基準にすることで、開催当日のイベントも終日含める。 */
export function buildApprovedFutureEventWhere(now: Date): Prisma.EventWhereInput {
  const startOfToday = startOfTodayJST(now);
  return {
    approval_status: "APPROVED",
    OR: [
      {
        AND: [
          { event_end_date: { not: null } },
          { event_end_date: { gte: startOfToday } },
        ],
      },
      {
        AND: [{ event_end_date: null }, { event_date: { gte: startOfToday } }],
      },
    ],
  };
}

export function buildApprovedFutureEventWhereDrizzle(now: Date) {
  const startOfToday = startOfTodayJST(now).toISOString();
  return and(
    eq(events.approvalStatus, "APPROVED"),
    or(
      and(
        isNotNull(events.eventEndDate),
        gte(events.eventEndDate, startOfToday)
      ),
      and(
        isNull(events.eventEndDate),
        gte(events.eventDate, startOfToday)
      )
    )
  );
}
