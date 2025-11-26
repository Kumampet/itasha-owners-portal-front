import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reminders
// ユーザーのリマインダー一覧を取得
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
      orderBy: {
        created_at: "desc",
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
        notified: reminder.notified,
        notified_at: reminder.notified_at,
        created_at: reminder.created_at,
      };
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

