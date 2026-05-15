import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JAPAN_PREFECTURES } from "@/lib/japan-prefectures";

/**
 * クエリ `yearMonth=YYYY-MM` を日本時間の暦月範囲に変換する。
 * 開催年月フィルターは event_date（開催開始日）のみで判定し、event_end_date は見ない。
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

// GET /api/events
// 承認済みのイベントリストをDBから取得するAPI
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortOrder = searchParams.get("sortOrder") || "asc"; // "asc" = 開催日が近い順, "desc" = 開催日が遠い順
    const prefectureParam = searchParams.get("prefecture") || "";
    const yearMonthParam = searchParams.get("yearMonth") || "";

    const now = new Date();

    // 過去のイベントを除外する条件（終了日がある場合は終了日、ない場合は開始日で判定）
    const dateFilter = {
      OR: [
        {
          AND: [
            { event_end_date: { not: null } },
            { event_end_date: { gte: now } },
          ],
        },
        {
          AND: [
            { event_end_date: null },
            { event_date: { gte: now } },
          ],
        },
      ],
    };

    const prefectureAccepted =
      prefectureParam && (JAPAN_PREFECTURES as readonly string[]).includes(prefectureParam)
        ? prefectureParam
        : null;

    const ymBounds = parseYearMonthRangeJst(yearMonthParam);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andConditions: any[] = [dateFilter];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { prefecture: { contains: search } },
          { city: { contains: search } },
          { venue_name: { contains: search } },
        ],
      });
    }

    if (prefectureAccepted) {
      andConditions.push({ prefecture: prefectureAccepted });
    }

    // 開催年月: 開始日（event_date）が該当月（JST 暦）に含まれるもののみ
    if (ymBounds) {
      andConditions.push({
        event_date: {
          gte: ymBounds.gte,
          lt: ymBounds.lt,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      approval_status: "APPROVED",
      AND: andConditions,
    };

    // ソート条件: デフォルトは現在日から開催日時の近い順（昇順）
    const orderBy: { event_date: "asc" | "desc" } = {
      event_date: sortOrder === "desc" ? "desc" : "asc",
    };

    // 総件数を取得
    const totalCount = await prisma.event.count({ where });

    // ページネーションでイベントを取得
    const skip = (page - 1) * limit;
    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        event_date: true,
        event_end_date: true,
        is_multi_day: true,
        prefecture: true,
        city: true,
        street_address: true,
        venue_name: true,
        keywords: true,
        official_urls: true,
        image_url: true,
        approval_status: true,
        entries: {
          select: {
            entry_number: true,
            entry_start_at: true,
            entry_start_public_at: true,
            entry_deadline_at: true,
            payment_due_type: true,
            payment_due_at: true,
            payment_due_days_after_entry: true,
            payment_due_public_at: true,
          },
          orderBy: {
            entry_number: "asc",
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // 公開日時が未来の場合は該当日時を非公開にする
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredEvents = events.map((event: any) => ({
      ...event,
      entries: (event.entries || []).map((entry: { entry_start_public_at: Date | null; entry_start_at: Date; payment_due_public_at: Date | null; payment_due_at: Date | null }) => {
        const entryStartAt =
          entry.entry_start_public_at &&
          entry.entry_start_public_at !== null &&
            new Date(entry.entry_start_public_at) > now
            ? null
            : entry.entry_start_at;

        const paymentDueAt =
          entry.payment_due_public_at &&
          entry.payment_due_public_at !== null &&
            new Date(entry.payment_due_public_at) > now
            ? null
            : entry.payment_due_at;

        return {
          ...entry,
          entry_start_at: entryStartAt,
          payment_due_at: paymentDueAt,
        };
      }),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    // CloudFront（Amplify Hosting のエッジ）で1分間キャッシュ
    // これにより、1分間はDBへのクエリが発生しなくなる
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
