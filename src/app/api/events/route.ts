import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventEntries } from "@/db/schema";
import { JAPAN_PREFECTURES } from "@/lib/japan-prefectures";
import { startOfTodayJST } from "@/lib/date-utils";
import { eq, and, or, gte, lt, like, desc, asc, sql, isNull, isNotNull } from "drizzle-orm";

/**
 * クエリ `yearMonth=YYYY-MM` を日本時間の暦月範囲に変換する。
 */
function parseYearMonthRangeJst(raw: string | null): { gte: Date; lt: Date } | null {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return null;
  const [ys, ms] = raw.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const gte = new Date(`${y}-${pad(m)}-01T00:00:00+09:00`);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const lt = new Date(`${nextY}-${pad(nextM)}-01T00:00:00+09:00`);
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lt.getTime())) return null;
  return { gte, lt };
}

function mapDrizzleEventToResponse(event: any, now: Date) {
  const tagsList = (event.eventTags || []).map((et: any) => ({
    tag: {
      name: et.tag?.name || "",
    }
  }));

  const entriesList = (event.eventEntries || []).map((entry: any) => {
    // 公開日時が未来の場合は該当日時を非公開にする
    const entryStartAt =
      entry.entryStartPublicAt &&
      new Date(entry.entryStartPublicAt) > now
        ? null
        : entry.entryStartAt;

    const paymentDueAt =
      entry.paymentDuePublicAt &&
      new Date(entry.paymentDuePublicAt) > now
        ? null
        : entry.paymentDueAt;

    return {
      entry_number: entry.entryNumber,
      entry_start_at: entryStartAt ? new Date(entryStartAt).toISOString() : null,
      entry_start_public_at: entry.entryStartPublicAt ? new Date(entry.entryStartPublicAt).toISOString() : null,
      entry_deadline_at: entry.entryDeadlineAt ? new Date(entry.entryDeadlineAt).toISOString() : null,
      payment_due_type: entry.paymentDueType,
      payment_due_at: paymentDueAt ? new Date(paymentDueAt).toISOString() : null,
      payment_due_days_after_entry: entry.paymentDueDaysAfterEntry,
      payment_due_public_at: entry.paymentDuePublicAt ? new Date(entry.paymentDuePublicAt).toISOString() : null,
    };
  });

  // keywords, officialUrls は SQLite 上では文字列 (JSON) または null として保存されている
  let keywords = [];
  try {
    keywords = event.keywords ? (typeof event.keywords === "string" ? JSON.parse(event.keywords) : event.keywords) : [];
  } catch {}

  let officialUrls = [];
  try {
    officialUrls = event.officialUrls ? (typeof event.officialUrls === "string" ? JSON.parse(event.officialUrls) : event.officialUrls) : [];
  } catch {}

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    event_date: new Date(event.eventDate).toISOString(),
    event_end_date: event.eventEndDate ? new Date(event.eventEndDate).toISOString() : null,
    is_multi_day: event.isMultiDay,
    prefecture: event.prefecture,
    city: event.city,
    street_address: event.streetAddress,
    venue_name: event.venueName,
    keywords,
    official_urls: officialUrls,
    image_url: event.imageUrl,
    approval_status: event.approvalStatus,
    entries: entriesList,
    tags: tagsList,
  };
}

// GET /api/events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const prefectureParam = searchParams.get("prefecture") || "";
    const yearMonthParam = searchParams.get("yearMonth") || "";

    const now = new Date();
    const startOfToday = startOfTodayJST(now);
    const startOfTodayStr = startOfToday.toISOString();

    // 過去のイベントを除外する条件
    const dateFilter = or(
      and(
        isNotNull(events.eventEndDate),
        gte(events.eventEndDate, startOfTodayStr)
      ),
      and(
        isNull(events.eventEndDate),
        gte(events.eventDate, startOfTodayStr)
      )
    );

    const prefectureAccepted =
      prefectureParam && (JAPAN_PREFECTURES as readonly string[]).includes(prefectureParam)
        ? prefectureParam
        : null;

    const ymBounds = parseYearMonthRangeJst(yearMonthParam);

    const andConditions: any[] = [
      eq(events.approvalStatus, "APPROVED"),
      dateFilter
    ];

    if (search) {
      andConditions.push(
        or(
          like(events.name, `%${search}%`),
          like(events.description, `%${search}%`),
          like(events.prefecture, `%${search}%`),
          like(events.city, `%${search}%`),
          like(events.venueName, `%${search}%`)
        )
      );
    }

    if (prefectureAccepted) {
      andConditions.push(eq(events.prefecture, prefectureAccepted));
    }

    if (ymBounds) {
      andConditions.push(
        and(
          gte(events.eventDate, ymBounds.gte.toISOString()),
          lt(events.eventDate, ymBounds.lt.toISOString())
        )
      );
    }

    const finalWhere = and(...andConditions);

    // 総件数を取得
    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(finalWhere);
    const totalCount = countRes[0]?.count || 0;

    // ページネーションで取得
    const skip = (page - 1) * limit;
    const eventsList = await db.query.events.findMany({
      where: finalWhere,
      orderBy: sortOrder === "desc" ? desc(events.eventDate) : asc(events.eventDate),
      offset: skip,
      limit: limit,
      with: {
        eventEntries: {
          orderBy: asc(eventEntries.entryNumber),
        },
        eventTags: {
          with: {
            tag: {
              columns: {
                name: true,
              }
            }
          }
        }
      }
    });

    const filteredEvents = eventsList.map((event: any) => mapDrizzleEventToResponse(event, now));
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        events: filteredEvents,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "Error";

    return NextResponse.json(
      {
        error: "Failed to fetch events.",
        message: errorMessage,
        type: errorName,
      },
      { status: 500 }
    );
  }
}
