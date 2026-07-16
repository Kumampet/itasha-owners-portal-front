import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scheduleExists } from "@/lib/reminder-scheduler";

// GET /api/reminders/[id]/schedule
// リマインダーのEventBridgeスケジュールの存在を確認
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

    // リマインダーが存在し、ユーザーが所有しているか確認
    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    if (reminder.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // リマインダーデータから通知時刻を取得
    let reminderData: any = {};
    try {
      reminderData = typeof reminder.reminderData === "string"
        ? JSON.parse(reminder.reminderData)
        : reminder.reminderData;
    } catch {}

    const reminderDate = new Date(reminderData.datetime);
    const now = new Date();

    // スケジュールの存在を確認
    const exists = await scheduleExists(reminder.id);

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      {
        reminderId: reminder.id,
        scheduleExists: exists,
        reminderDate: reminderData.datetime,
        isPast: reminderDate < now,
        isNotified: reminder.notified,
        shouldHaveSchedule: reminderDate > now && !reminder.notified,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error checking schedule:", error);
    return NextResponse.json(
      { error: "Failed to check schedule", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
