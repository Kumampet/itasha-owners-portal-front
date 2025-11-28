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
        // @ts-expect-error - Prisma型が更新されていない可能性があるが、スキーマには存在する
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
            payment_due_at: true,
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
export async function GET() {
  try {
    const events = await getCachedEvents();
    const now = new Date();

    // 公開日時が未来の場合は該当日時を非公開にする
    const filteredEvents = events.map((event: any) => ({
      ...event,
      entries: (event.entries || []).map((entry: any) => {
        const entryStartAt =
          entry.entry_start_public_at &&
            new Date(entry.entry_start_public_at) > now
            ? null
            : entry.entry_start_at;

        const paymentDueAt =
          entry.payment_due_public_at &&
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

    return NextResponse.json(filteredEvents);
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
