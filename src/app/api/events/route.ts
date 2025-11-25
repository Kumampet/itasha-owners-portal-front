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
        theme: true,
        description: true, // 詳細情報も取得
        event_date: true,
        entry_start_at: true,
        payment_due_at: true,
        original_url: true,
        approval_status: true,

        // 主催者情報はOptional (organizer_user_idがnullの場合もあるため)
        organizer_user: {
          select: {
            id: true,
            email: true,
            custom_profile_url: true,
          },
        },

        // タグ情報（現在はseedデータに入れていないため、空のリストが返る想定）
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
    return NextResponse.json(events);
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
