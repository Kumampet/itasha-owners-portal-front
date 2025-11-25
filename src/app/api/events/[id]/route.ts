import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// キャッシュされた個別イベント取得関数
// ISR: 60秒間キャッシュしてDB負荷を軽減
const getCachedEvent = (id: string) =>
  unstable_cache(
    async () => {
      return await prisma.event.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          theme: true,
          description: true,
          event_date: true,
          entry_start_at: true,
          payment_due_at: true,
          original_url: true,
          prefecture: true,
          city: true,
          street_address: true,
          venue_name: true,
          approval_status: true,
          organizer_user: {
            select: {
              id: true,
              email: true,
              custom_profile_url: true,
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
      });
    },
    [`event-${id}`], // イベントIDを含むキャッシュキー
    {
      revalidate: 60, // 60秒で再検証
      tags: ["events", `event-${id}`], // キャッシュタグ（revalidateTagで無効化可能）
    }
  )();

// GET /api/events/[id]
// 個別のイベント情報をDBから取得するAPI
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await getCachedEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event." },
      { status: 500 }
    );
  }
}
