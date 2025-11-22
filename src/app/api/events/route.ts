import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 修正は不要ですが、PrismaClientのインポートを確認

// GET /api/events
// 承認済みのイベントリストをDBから取得するAPI
export async function GET() {
  try {
    // 承認ステータスが "APPROVED" のイベントのみを取得
    // 主催者情報も含める (リレーション)
    const events = await prisma.event.findMany({
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

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}
