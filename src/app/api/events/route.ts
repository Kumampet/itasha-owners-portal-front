import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// キャッシュされたイベント取得関数
// ISR: 60秒間キャッシュしてDB負荷を軽減
const getCachedEvents = unstable_cache(
  async () => {
    // 承認ステータスが "APPROVED" のイベントのみを取得
    // 主催者情報も含める (リレーション)
    return await prisma.event.findMany({
      where: {
        approval_status: "APPROVED",
      },
      // Eventモデルから必要なフィールドを選択
      select: {
        id: true,
        name: true,
        description: true, // 詳細情報も取得
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

        // 主催者情報はOptional (organizer_user_idがnullの場合もあるため)
        organizer_user: {
          select: {
            id: true,
            email: true,
            custom_profile_url: true,
          },
        },

        // エントリー情報
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

        // タグ情報（後方互換性のため残す）
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
      // イベント開催日の降順でソート
      orderBy: {
        event_date: "desc",
      },
    });
  },
  ["events"], // キャッシュキー
  {
    revalidate: 60, // 60秒で再検証
    tags: ["events"], // キャッシュタグ（revalidateTagで無効化可能）
  }
);

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

    // 検索条件とソート条件を構築
    const where: any = {
      approval_status: "APPROVED",
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { prefecture: { contains: search } },
        { city: { contains: search } },
        { venue_name: { contains: search } },
      ];
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
    type EventType = (typeof events)[number];
    type EntryType = NonNullable<EventType["entries"]>[number];
    const filteredEvents = events.map((event: EventType) => ({
      ...event,
      entries: (event.entries || []).map((entry: EntryType) => {
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

    return NextResponse.json({
      events: filteredEvents,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
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
