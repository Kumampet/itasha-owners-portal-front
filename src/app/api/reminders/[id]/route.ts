import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reminders/[id]
// リマインダー詳細を取得
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

    const reminder = await prisma.reminder.findUnique({
      where: { id },
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

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

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
    console.error("Error fetching reminder:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

// PATCH /api/reminders/[id]
// リマインダーを更新
export async function PATCH(
  request: Request,
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

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { label, datetime, event_id, note } = body;

    // イベント情報を取得
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // リマインダーデータを更新
    const reminderData = reminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        event_id: event_id,
        reminder_data: {
          type: reminderData.type || "custom",
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

    const updatedReminderData = updatedReminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };

    return NextResponse.json({
      id: updatedReminder.id,
      event: {
        id: updatedReminder.event.id,
        name: updatedReminder.event.name,
        theme: updatedReminder.event.theme,
        event_date: updatedReminder.event.event_date,
        original_url: updatedReminder.event.original_url,
      },
      type: updatedReminderData.type,
      datetime: updatedReminderData.datetime,
      label: updatedReminderData.label,
      note: updatedReminder.note,
      notified: updatedReminder.notified,
      notified_at: updatedReminder.notified_at,
      created_at: updatedReminder.created_at,
    });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE /api/reminders/[id]
// リマインダーを削除
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

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Reminder deleted" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}

