import type { Prisma } from "@prisma/client";

/** 一覧 API と同様、公開中かつ「まだ終了していない」承認済みイベント */
export function buildApprovedFutureEventWhere(now: Date): Prisma.EventWhereInput {
  return {
    approval_status: "APPROVED",
    OR: [
      {
        AND: [
          { event_end_date: { not: null } },
          { event_end_date: { gte: now } },
        ],
      },
      {
        AND: [{ event_end_date: null }, { event_date: { gte: now } }],
      },
    ],
  };
}
