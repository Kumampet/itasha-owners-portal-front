import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reminders, events } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { createReminderSchedule } from "@/lib/reminder-scheduler";

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

    // 全リマインダーを読み込み、通知時刻から1時間以上過ぎたものを自動削除
    const allReminders = await db
      .select({
        id: reminders.id,
        reminderData: reminders.reminderData,
      })
      .from(reminders)
      .where(eq(reminders.userId, userId));

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1時間前
    
    const expiredReminderIds = allReminders
      .filter((reminder) => {
        try {
          const reminderData = typeof reminder.reminderData === "string" 
            ? JSON.parse(reminder.reminderData) 
            : reminder.reminderData;
          const reminderDate = new Date(reminderData.datetime);
          return reminderDate < oneHourAgo;
        } catch (error) {
          console.error(`Error parsing reminder ${reminder.id} for deletion:`, error);
          return false;
        }
      })
      .map((reminder) => reminder.id);

    if (expiredReminderIds.length > 0) {
      await db
        .delete(reminders)
        .where(inArray(reminders.id, expiredReminderIds));
      console.log(`[Reminders] Deleted ${expiredReminderIds.length} expired reminder(s)`);
    }

    // ソート順を取得
    const { searchParams } = new URL(request.url);
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const remindersList = await db.query.reminders.findMany({
      where: eq(reminders.userId, userId),
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

    // リマインダーデータを整形
    const formattedReminders = remindersList.map((reminder) => {
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

      return {
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
      };
    });

    // 日時でソート
    formattedReminders.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      formattedReminders,
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch reminders", details: errorMessage },
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

    const reminderId = crypto.randomUUID();
    const reminderData = {
      type: "custom",
      datetime: datetime,
      label: label,
      event_id: event_id || null,
      event_name: event?.name || null,
    };

    // リマインダーを作成
    await db.insert(reminders).values({
      id: reminderId,
      userId: userId,
      eventId: event_id || null,
      reminderData: JSON.stringify(reminderData),
      note: note || null,
      notified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // EventBridge Schedulerにスケジュールを作成（通知時刻が未来の場合のみ）
    const reminderDate = new Date(reminderData.datetime);
    let scheduleResult = null;
    if (reminderDate > new Date()) {
      try {
        scheduleResult = await createReminderSchedule(reminderId, reminderDate);
        if (!scheduleResult.success) {
          console.warn(`[Reminder API] Failed to create schedule for reminder ${reminderId}: ${scheduleResult.error}`);
        } else {
          console.log(`[Reminder API] Successfully created schedule for reminder ${reminderId}: ${scheduleResult.scheduleArn}`);
        }
      } catch (error) {
        console.error(`[Reminder API] Error creating schedule for reminder ${reminderId}:`, error);
        scheduleResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
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
    const reminderFirstUrl = officialUrls && officialUrls.length > 0 ? officialUrls[0] : null;

    // 書き込み操作で即座に反映が必要なのでキャッシュを無効にする
    return NextResponse.json(
      {
        id: reminderId,
        event: event ? {
          id: event.id,
          name: event.name,
          event_date: new Date(event.eventDate).toISOString(),
          original_url: reminderFirstUrl,
        } : null,
        type: reminderData.type,
        datetime: reminderData.datetime,
        label: reminderData.label,
        note: note || null,
        notified: false,
        notified_at: null,
        created_at: new Date().toISOString(),
        schedule: scheduleResult ? {
          created: scheduleResult.success,
          scheduleArn: scheduleResult.scheduleArn || null,
          error: scheduleResult.error || null,
        } : null,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
