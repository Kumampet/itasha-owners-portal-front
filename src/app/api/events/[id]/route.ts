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

    const now = new Date();

    // 公開日時が未来の場合は該当日時を非公開にする
    type EntryType = NonNullable<typeof event.entries>[number];
    const filteredEvent = {
      ...event,
      entries: (event.entries || []).map((entry: EntryType) => {
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
    };

    return NextResponse.json(filteredEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event." },
      { status: 500 }
    );
  }
}
