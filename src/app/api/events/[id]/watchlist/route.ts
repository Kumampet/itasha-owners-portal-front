import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { events, eventFollows, reminders, eventEntries } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// イベントの期限情報を取得してリマインダーデータを生成する関数
// 将来の仕様変更に対応するため、柔軟なJSON形式で保存
async function generateRemindersForEvent(eventId: string, userId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      eventEntries: {
        orderBy: asc(eventEntries.entryNumber),
      }
    }
  });

  if (!event) {
    return [];
  }

  const reminderItems: Array<{
    reminder_data: {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };
  }> = [];

  const now = new Date();

  // エントリー情報からリマインダーを生成（最初のエントリーのみ）
  if (event.eventEntries && event.eventEntries.length > 0) {
    const firstEntry = event.eventEntries[0];

    // エントリー開始日時（公開日時が未来の場合は非表示）
    const entryStartAt =
      firstEntry.entryStartPublicAt &&
      new Date(firstEntry.entryStartPublicAt) > now
        ? null
        : firstEntry.entryStartAt;

    if (entryStartAt) {
      reminderItems.push({
        reminder_data: {
          type: "entry_start",
          datetime: new Date(entryStartAt).toISOString(),
          label: "エントリー開始",
          event_id: event.id,
          event_name: event.name,
        },
      });
    }

    // 支払期限（公開日時が未来の場合は非表示）
    const paymentDueAt =
      firstEntry.paymentDuePublicAt &&
      new Date(firstEntry.paymentDuePublicAt) > now
        ? null
        : firstEntry.paymentDueAt;

    if (paymentDueAt) {
      reminderItems.push({
        reminder_data: {
          type: "payment_due",
          datetime: new Date(paymentDueAt).toISOString(),
          label: "支払期限",
          event_id: event.id,
          event_name: event.name,
        },
      });
    }
  }

  // イベント開催日
  reminderItems.push({
    reminder_data: {
      type: "event_date",
      datetime: new Date(event.eventDate).toISOString(),
      label: "イベント開催日",
      event_id: event.id,
      event_name: event.name,
    },
  });

  // リマインダーを作成
  const createdReminders = await Promise.all(
    reminderItems.map(async (reminder) => {
      const reminderId = crypto.randomUUID();
      const insertVal = {
        id: reminderId,
        userId: userId,
        eventId: eventId,
        reminderData: JSON.stringify(reminder.reminder_data),
        notified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert(reminders).values(insertVal);
      return insertVal;
    })
  );

  return createdReminders;
}

// GET /api/events/[id]/watchlist
// ウォッチリスト登録状態を取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const follow = await db
      .select()
      .from(eventFollows)
      .where(and(eq(eventFollows.userId, userId), eq(eventFollows.eventId, id)))
      .get();

    // リアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      {
        isWatching: !!follow,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error checking watchlist status:", error);
    return NextResponse.json(
      { error: "Failed to check watchlist status" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/watchlist
// ウォッチリストに追加
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // 既に登録されているか確認
    const existing = await db
      .select()
      .from(eventFollows)
      .where(and(eq(eventFollows.userId, userId), eq(eventFollows.eventId, id)))
      .get();

    if (existing) {
      return NextResponse.json({ message: "Already in watchlist" });
    }

    // ウォッチリストに追加
    await db.insert(eventFollows).values({
      userId: userId,
      eventId: id,
      followedAt: new Date().toISOString(),
    });

    // リマインダーを自動生成
    await generateRemindersForEvent(id, userId);

    return NextResponse.json({ message: "Added to watchlist" });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/watchlist
// ウォッチリストから削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // ウォッチリストから削除
    await db
      .delete(eventFollows)
      .where(and(eq(eventFollows.userId, userId), eq(eventFollows.eventId, id)));

    // 関連するリマインダーも削除
    await db
      .delete(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.eventId, id)));

    return NextResponse.json({ message: "Removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
