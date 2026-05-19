import type { Prisma } from "@prisma/client";
import { startOfTodayJST } from "@/lib/date-utils";

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
