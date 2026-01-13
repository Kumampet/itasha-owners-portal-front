import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateReminderSchedule, deleteReminderSchedule } from "@/lib/reminder-scheduler";

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
            event_date: true,
            official_urls: true,
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
      event_id: string | null;
      event_name: string | null;
    };

    // official_urlsは配列なので、最初のURLをoriginal_urlとして返す（後方互換性のため）
    const officialUrls = reminder.event?.official_urls as string[] | null;
    const firstUrl = officialUrls && officialUrls.length > 0 ? officialUrls[0] : null;

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      {
        id: reminder.id,
        event: reminder.event ? {
          id: reminder.event.id,
          name: reminder.event.name,
          event_date: reminder.event.event_date,
          original_url: firstUrl,
        } : null,
        type: reminderData.type,
        datetime: reminderData.datetime,
        label: reminderData.label,
        note: reminder.note,
        notified: reminder.notified,
        notified_at: reminder.notified_at,
        created_at: reminder.created_at,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
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

    // event_idが指定されている場合のみイベント情報を取得
    let event = null;
    if (event_id) {
      event = await prisma.event.findUnique({
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
    }

    // リマインダーデータを更新
    const reminderData = reminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string | null;
      event_name: string | null;
    };

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        event_id: event_id || null,
        reminder_data: {
          type: reminderData.type || "custom",
          datetime: datetime,
          label: label,
          event_id: event_id || null,
          event_name: event?.name || null,
        },
        note: note || null,
      },
      include: {
        event: event ? {
          select: {
            id: true,
            name: true,
            event_date: true,
            official_urls: true,
          },
        } : false,
      },
    });

    const updatedReminderData = updatedReminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string | null;
      event_name: string | null;
    };

    // EventBridge Schedulerのスケジュールを更新（通知時刻が未来の場合のみ）
    const reminderDate = new Date(updatedReminderData.datetime);
    if (reminderDate > new Date() && !updatedReminder.notified) {
      try {
        const scheduleResult = await updateReminderSchedule(updatedReminder.id, reminderDate);
        if (!scheduleResult.success) {
          console.warn(`[Reminder API] Failed to update schedule for reminder ${updatedReminder.id}: ${scheduleResult.error}`);
          // スケジュール更新に失敗してもリマインダー更新は成功とする
        }
      } catch (error) {
        console.error(`[Reminder API] Error updating schedule for reminder ${updatedReminder.id}:`, error);
        // スケジュール更新に失敗してもリマインダー更新は成功とする
      }
    } else if (reminderDate <= new Date() || updatedReminder.notified) {
      // 過去のリマインダーまたは既に通知済みの場合はスケジュールを削除
      try {
        await deleteReminderSchedule(updatedReminder.id);
      } catch (error) {
        console.error(`[Reminder API] Error deleting schedule for reminder ${updatedReminder.id}:`, error);
      }
    }

    // official_urlsは配列なので、最初のURLをoriginal_urlとして返す（後方互換性のため）
    const updatedOfficialUrls = updatedReminder.event?.official_urls as string[] | null;
    const updatedFirstUrl = updatedOfficialUrls && updatedOfficialUrls.length > 0 ? updatedOfficialUrls[0] : null;

    // 書き込み操作で即座に反映が必要なのでキャッシュを無効にする
    return NextResponse.json(
      {
        id: updatedReminder.id,
        event: updatedReminder.event ? {
          id: updatedReminder.event.id,
          name: updatedReminder.event.name,
          event_date: updatedReminder.event.event_date,
          original_url: updatedFirstUrl,
        } : null,
        type: updatedReminderData.type,
        datetime: updatedReminderData.datetime,
        label: updatedReminderData.label,
        note: updatedReminder.note,
        notified: updatedReminder.notified,
        notified_at: updatedReminder.notified_at,
        created_at: updatedReminder.created_at,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
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

    // EventBridge Schedulerのスケジュールを削除
    try {
      await deleteReminderSchedule(id);
    } catch (error) {
      console.error(`[Reminder API] Error deleting schedule for reminder ${id}:`, error);
      // スケジュール削除に失敗してもリマインダー削除は続行
    }

    await prisma.reminder.delete({
      where: { id },
    });

    // 書き込み操作で即座に反映が必要なのでキャッシュを無効にする
    return NextResponse.json(
      { message: "Reminder deleted" },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}

