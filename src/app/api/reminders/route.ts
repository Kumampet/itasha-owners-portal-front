import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

    // 通知時刻から1時間以上過ぎたリマインダーを自動削除
    // 通知が送信されていないリマインダーも含めて、通知時刻から1時間以上過ぎたもののみ削除
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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1時間前
    
    const expiredReminderIds = allReminders
      .filter((reminder) => {
        try {
          const reminderData = reminder.reminder_data as {
            datetime: string;
          };
          const reminderDate = new Date(reminderData.datetime);
          // 通知時刻から1時間以上過ぎたリマインダーを削除対象とする
          return reminderDate < oneHourAgo;
        } catch (error) {
          console.error(`Error parsing reminder ${reminder.id} for deletion:`, error);
          return false;
        }
      })
      .map((reminder) => reminder.id);

    if (expiredReminderIds.length > 0) {
      await prisma.reminder.deleteMany({
        where: {
          id: {
            in: expiredReminderIds,
          },
        },
      });
      console.log(`[Reminders] Deleted ${expiredReminderIds.length} expired reminder(s)`);
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
            event_date: true,
            official_urls: true,
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
        event_id: string | null;
        event_name: string | null;
      };

      // official_urlsは配列なので、最初のURLをoriginal_urlとして返す（後方互換性のため）
      const officialUrls = reminder.event?.official_urls as string[] | null;
      const firstUrl = officialUrls && officialUrls.length > 0 ? officialUrls[0] : null;

      return {
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
    let event = null;
    if (event_id) {
      event = await prisma.event.findUnique({
        where: { id: event_id },
        select: {
          id: true,
          name: true,
          event_date: true,
          official_urls: true,
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
    }

    // リマインダーを作成
    const reminder = await prisma.reminder.create({
      data: {
        user_id: userId,
        event_id: event_id || null,
        reminder_data: {
          type: "custom",
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

    const reminderData = reminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string | null;
      event_name: string | null;
    };

    // EventBridge Schedulerにスケジュールを作成（通知時刻が未来の場合のみ）
    const reminderDate = new Date(reminderData.datetime);
    let scheduleResult = null;
    if (reminderDate > new Date() && !reminder.notified) {
      try {
        scheduleResult = await createReminderSchedule(reminder.id, reminderDate);
        if (!scheduleResult.success) {
          console.warn(`[Reminder API] Failed to create schedule for reminder ${reminder.id}: ${scheduleResult.error}`);
          // スケジュール作成に失敗してもリマインダー作成は成功とする
        } else {
          console.log(`[Reminder API] Successfully created schedule for reminder ${reminder.id}: ${scheduleResult.scheduleArn}`);
        }
      } catch (error) {
        console.error(`[Reminder API] Error creating schedule for reminder ${reminder.id}:`, error);
        scheduleResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        // スケジュール作成に失敗してもリマインダー作成は成功とする
      }
    }

    // official_urlsは配列なので、最初のURLをoriginal_urlとして返す（後方互換性のため）
    const reminderOfficialUrls = reminder.event?.official_urls as string[] | null;
    const reminderFirstUrl = reminderOfficialUrls && reminderOfficialUrls.length > 0 ? reminderOfficialUrls[0] : null;

    return NextResponse.json({
      id: reminder.id,
      event: reminder.event ? {
        id: reminder.event.id,
        name: reminder.event.name,
        event_date: reminder.event.event_date,
        original_url: reminderFirstUrl,
      } : null,
      type: reminderData.type,
      datetime: reminderData.datetime,
      label: reminderData.label,
      note: reminder.note,
      notified: reminder.notified,
      notified_at: reminder.notified_at,
      created_at: reminder.created_at,
      schedule: scheduleResult ? {
        created: scheduleResult.success,
        scheduleArn: scheduleResult.scheduleArn || null,
        error: scheduleResult.error || null,
      } : null,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}

