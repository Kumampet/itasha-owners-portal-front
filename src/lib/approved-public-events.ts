import { startOfTodayJST } from "@/lib/date-utils";
import { events } from "@/db/schema";
import { and, or, eq, gte, isNull, isNotNull } from "drizzle-orm";

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
