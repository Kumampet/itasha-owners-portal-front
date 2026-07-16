import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reminders, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
      with: {
        event: {
          columns: {
            id: true,
            name: true,
            eventDate: true,
            officialUrls: true,
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
    if (reminder.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    let reminderData: any = {};
    try {
      reminderData = typeof reminder.reminderData === "string"
        ? JSON.parse(reminder.reminderData)
        : reminder.reminderData;
    } catch {}

    let officialUrls: string[] | null = null;
    try {
      if (reminder.event?.officialUrls) {
        officialUrls = typeof reminder.event.officialUrls === "string"
          ? JSON.parse(reminder.event.officialUrls)
          : reminder.event.officialUrls;
      }
    } catch {}
    const firstUrl = officialUrls && officialUrls.length > 0 ? officialUrls[0] : null;

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      {
        id: reminder.id,
        event: reminder.event ? {
          id: reminder.event.id,
          name: reminder.event.name,
          event_date: new Date(reminder.event.eventDate).toISOString(),
          original_url: firstUrl,
        } : null,
        type: reminderData.type,
        datetime: reminderData.datetime,
        label: reminderData.label,
        note: reminder.note,
        notified: reminder.notified,
        notified_at: reminder.notifiedAt ? new Date(reminder.notifiedAt).toISOString() : null,
        created_at: new Date(reminder.createdAt).toISOString(),
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

    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { label, datetime, event_id, note } = body;

    // event_idが指定されている場合のみイベント情報を取得
    let event: any = null;
    if (event_id) {
      event = await db
        .select({
          id: events.id,
          name: events.name,
          eventDate: events.eventDate,
          officialUrls: events.officialUrls,
        })
        .from(events)
        .where(eq(events.id, event_id))
        .get();

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
    }

    let reminderData: any = {};
    try {
      reminderData = typeof reminder.reminderData === "string"
        ? JSON.parse(reminder.reminderData)
        : reminder.reminderData;
    } catch {}

    const newReminderData = {
      type: reminderData.type || "custom",
      datetime: datetime,
      label: label,
      event_id: event_id || null,
      event_name: event?.name || null,
    };

    // リマインダーを更新
    await db
      .update(reminders)
      .set({
        eventId: event_id || null,
        reminderData: JSON.stringify(newReminderData),
        note: note || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reminders.id, id));

    // EventBridge Schedulerのスケジュールを更新（通知時刻が未来の場合のみ）
    const reminderDate = new Date(newReminderData.datetime);
    if (reminderDate > new Date() && !reminder.notified) {
      try {
        const scheduleResult = await updateReminderSchedule(id, reminderDate);
        if (!scheduleResult.success) {
          console.warn(`[Reminder API] Failed to update schedule for reminder ${id}: ${scheduleResult.error}`);
        }
      } catch (error) {
        console.error(`[Reminder API] Error updating schedule for reminder ${id}:`, error);
      }
    } else if (reminderDate <= new Date() || reminder.notified) {
      // 過去のリマインダーまたは既に通知済みの場合はスケジュールを削除
      try {
        await deleteReminderSchedule(id);
      } catch (error) {
        console.error(`[Reminder API] Error deleting schedule for reminder ${id}:`, error);
      }
    }

    let officialUrls: string[] | null = null;
    try {
      if (event?.officialUrls) {
        officialUrls = typeof event.officialUrls === "string"
          ? JSON.parse(event.officialUrls)
          : event.officialUrls;
      }
    } catch {}
    const updatedFirstUrl = officialUrls && officialUrls.length > 0 ? officialUrls[0] : null;

    // 書き込み操作で即座に反映が必要なのでキャッシュを無効にする
    return NextResponse.json(
      {
        id: id,
        event: event ? {
          id: event.id,
          name: event.name,
          event_date: new Date(event.eventDate).toISOString(),
          original_url: updatedFirstUrl,
        } : null,
        type: newReminderData.type,
        datetime: newReminderData.datetime,
        label: newReminderData.label,
        note: note || null,
        notified: reminder.notified,
        notified_at: reminder.notifiedAt ? new Date(reminder.notifiedAt).toISOString() : null,
        created_at: new Date(reminder.createdAt).toISOString(),
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

    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.userId !== userId) {
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
    }

    await db.delete(reminders).where(eq(reminders.id, id));

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
