import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { events, eventEntries } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// キャッシュされた個別イベント取得関数
// ISR: 60秒間キャッシュしてDB負荷を軽減
const getCachedEvent = (id: string) =>
  unstable_cache(
    async () => {
      return await db.query.events.findFirst({
        where: eq(events.id, id),
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

    // 公開日時が未来の場合は該当日時を非公開にし、レスポンス形式をフロントエンドに合わせる
    const tagsList = (event.eventTags || []).map((et: any) => ({
      tag: {
        name: et.tag?.name || "",
      }
    }));

    const entriesList = (event.eventEntries || []).map((entry: any) => {
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

    let keywords = [];
    try {
      keywords = event.keywords ? (typeof event.keywords === "string" ? JSON.parse(event.keywords) : event.keywords) : [];
    } catch {}

    let officialUrls = [];
    try {
      officialUrls = event.officialUrls ? (typeof event.officialUrls === "string" ? JSON.parse(event.officialUrls) : event.officialUrls) : [];
    } catch {}

    const filteredEvent = {
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

    // CloudFront（Amplify Hosting のエッジ）で60秒間キャッシュ
    return NextResponse.json(
      filteredEvent,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event." },
      { status: 500 }
    );
  }
}
