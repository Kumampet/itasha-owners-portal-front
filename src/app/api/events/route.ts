import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events
// 承認済みのイベントリストをDBから取得するAPI
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortOrder = searchParams.get("sortOrder") || "asc"; // "asc" = 開催日が近い順, "desc" = 開催日が遠い順

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

    // 検索条件とソート条件を構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      approval_status: "APPROVED",
    };

    // 検索条件と日付フィルターを組み合わせ
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { prefecture: { contains: search } },
            { city: { contains: search } },
            { venue_name: { contains: search } },
          ],
        },
        dateFilter,
      ];
    } else {
      Object.assign(where, dateFilter);
    }

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
        organizer_user: {
          select: {
            id: true,
            email: true,
            custom_profile_url: true,
          },
        },
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
