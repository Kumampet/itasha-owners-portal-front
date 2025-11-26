import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// イベントの期限情報を取得してリマインダーデータを生成する関数
// 将来の仕様変更に対応するため、柔軟なJSON形式で保存
async function generateRemindersForEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      event_date: true,
      entry_start_at: true,
      payment_due_at: true,
    },
  });

  if (!event) {
    return [];
  }

  const reminders: Array<{
    reminder_data: {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };
  }> = [];

  // エントリー開始日時
  if (event.entry_start_at) {
    reminders.push({
      reminder_data: {
        type: "entry_start",
        datetime: event.entry_start_at.toISOString(),
        label: "エントリー開始",
        event_id: event.id,
        event_name: event.name,
      },
    });
  }

  // 支払期限
  if (event.payment_due_at) {
    reminders.push({
      reminder_data: {
        type: "payment_due",
        datetime: event.payment_due_at.toISOString(),
        label: "支払期限",
        event_id: event.id,
        event_name: event.name,
      },
    });
  }

  // イベント開催日
  reminders.push({
    reminder_data: {
      type: "event_date",
      datetime: event.event_date.toISOString(),
      label: "イベント開催日",
      event_id: event.id,
      event_name: event.name,
    },
  });

  // リマインダーを作成
  const createdReminders = await Promise.all(
    reminders.map((reminder) =>
      prisma.reminder.create({
        data: {
          user_id: userId,
          event_id: eventId,
          reminder_data: reminder.reminder_data,
        },
      })
    )
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

    const follow = await prisma.eventFollow.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: id,
        },
      },
    });

    return NextResponse.json({
      isWatching: !!follow,
    });
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
    const existing = await prisma.eventFollow.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already in watchlist" });
    }

    // ウォッチリストに追加
    await prisma.eventFollow.create({
      data: {
        user_id: userId,
        event_id: id,
      },
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
    await prisma.eventFollow.deleteMany({
      where: {
        user_id: userId,
        event_id: id,
      },
    });

    // 関連するリマインダーも削除
    await prisma.reminder.deleteMany({
      where: {
        user_id: userId,
        event_id: id,
      },
    });

    return NextResponse.json({ message: "Removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}

