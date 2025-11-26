import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reminders
// ユーザーのリマインダー一覧を取得
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 過去日のリマインダーを自動削除
    // まず全てのリマインダーを取得して、datetimeが過去のものを削除
    const allReminders = await prisma.reminder.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        reminder_data: true,
      },
    });

    const now = new Date();
    const pastReminderIds = allReminders
      .filter((reminder) => {
        const reminderData = reminder.reminder_data as {
          datetime: string;
        };
        return new Date(reminderData.datetime) < now;
      })
      .map((reminder) => reminder.id);

    if (pastReminderIds.length > 0) {
      await prisma.reminder.deleteMany({
        where: {
          id: {
            in: pastReminderIds,
          },
        },
      });
    }

    // ソート順を取得（デフォルトは期日が近い順に降順）
    const { searchParams } = new URL(request.url);
    const sortOrder = searchParams.get("sortOrder") || "asc"; // asc: 近い順（昇順）、desc: 遠い順（降順）

    const reminders = await prisma.reminder.findMany({
      where: {
        user_id: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            theme: true,
            event_date: true,
            original_url: true,
          },
        },
      },
    });

    // リマインダーデータを整形
    const formattedReminders = reminders.map((reminder) => {
      const reminderData = reminder.reminder_data as {
        type: string;
        datetime: string;
        label: string;
        event_id: string;
        event_name: string;
      };

      return {
        id: reminder.id,
        event: {
          id: reminder.event.id,
          name: reminder.event.name,
          theme: reminder.event.theme,
          event_date: reminder.event.event_date,
          original_url: reminder.event.original_url,
        },
        type: reminderData.type,
        datetime: reminderData.datetime,
        label: reminderData.label,
        note: reminder.note,
        notified: reminder.notified,
        notified_at: reminder.notified_at,
        created_at: reminder.created_at,
      };
    });

    // 日時でソート（デフォルトは期日が近い順に降順 = 昇順）
    formattedReminders.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST /api/reminders
// リマインダーを作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { label, datetime, event_id, note } = body;

    // イベント情報を取得
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: {
        id: true,
        name: true,
        theme: true,
        event_date: true,
        original_url: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // リマインダーを作成
    const reminder = await prisma.reminder.create({
      data: {
        user_id: userId,
        event_id: event_id,
        reminder_data: {
          type: "custom",
          datetime: datetime,
          label: label,
          event_id: event_id,
          event_name: event.name,
        },
        note: note || null,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            theme: true,
            event_date: true,
            original_url: true,
          },
        },
      },
    });

    const reminderData = reminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };

    return NextResponse.json({
      id: reminder.id,
      event: {
        id: reminder.event.id,
        name: reminder.event.name,
        theme: reminder.event.theme,
        event_date: reminder.event.event_date,
        original_url: reminder.event.original_url,
      },
      type: reminderData.type,
      datetime: reminderData.datetime,
      label: reminderData.label,
      note: reminder.note,
      notified: reminder.notified,
      notified_at: reminder.notified_at,
      created_at: reminder.created_at,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}

