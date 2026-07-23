import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventFollows, eventEntries } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

function mapDrizzleWatchlistToResponse(item: any) {
  const event = item.event;
  if (!event) return { ...item, event: null };

  const tagsList = (event.eventTags || []).map((et: any) => ({
    tag: {
      name: et.tag?.name || "",
    }
  }));

  const entriesList = (event.eventEntries || []).map((entry: any) => {
    return {
      entry_number: entry.entryNumber,
      entry_start_at: entry.entryStartAt ? new Date(entry.entryStartAt).toISOString() : null,
      entry_start_public_at: entry.entryStartPublicAt ? new Date(entry.entryStartPublicAt).toISOString() : null,
      entry_deadline_at: entry.entryDeadlineAt ? new Date(entry.entryDeadlineAt).toISOString() : null,
      payment_due_type: entry.paymentDueType,
      payment_due_at: entry.paymentDueAt ? new Date(entry.paymentDueAt).toISOString() : null,
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

  return {
    user_id: item.userId,
    event_id: item.eventId,
    followed_at: new Date(item.followedAt).toISOString(),
    event: {
      id: event.id,
      name: event.name,
      description: event.description,
      event_date: new Date(event.eventDate).toISOString(),
      event_end_date: event.eventEndDate ? new Date(event.eventEndDate).toISOString() : null,
      is_multi_day: event.isMultiDay,
      keywords,
      official_urls: officialUrls,
      image_url: event.imageUrl,
      approval_status: event.approvalStatus,
      entries: entriesList,
      tags: tagsList,
    }
  };
}

// GET /api/watchlist
// ユーザーのウォッチリスト一覧を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const watchlist = await db.query.eventFollows.findMany({
      where: eq(eventFollows.userId, userId),
      orderBy: desc(eventFollows.followedAt),
      with: {
        event: {
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
        }
      }
    });

    const mappedWatchlist = watchlist.map(mapDrizzleWatchlistToResponse);

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      mappedWatchlist,
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}
