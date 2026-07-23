import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/reminders/notify/[id]
// EventBridge Schedulerから呼び出される通知送信エンドポイント
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = _request.headers.get("authorization");
    const apiKey = process.env.REMINDER_NOTIFY_API_KEY?.trim();
    
    // デバッグログ
    console.log('[Notify API] REMINDER_NOTIFY_API_KEY is set:', !!apiKey);
    if (apiKey) {
      console.log('[Notify API] REMINDER_NOTIFY_API_KEY length:', apiKey.length);
    }
    console.log('[Notify API] Authorization header received:', authHeader ? 'present' : 'missing');
    
    if (apiKey) {
      const receivedKey = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7).trim() 
        : authHeader?.trim() || '';
      
      if (receivedKey !== apiKey) {
        console.error('[Notify API] Authentication failed');
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const { id } = await params;

    // リマインダーを取得
    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
          },
        },
        event: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!reminder) {
      console.warn(`[Reminder Notify] Reminder not found: ${id}`);
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 既に通知済みの場合はスキップ
    if (reminder.notified) {
      console.log(`[Reminder Notify] Reminder already notified: ${id}`);
      return NextResponse.json({
        success: true,
        message: "Reminder already notified",
        reminderId: id,
      });
    }

    // リマインダーデータを取得
    let reminderData: any = {};
    try {
      if (typeof reminder.reminderData === "string") {
        reminderData = JSON.parse(reminder.reminderData);
      } else {
        reminderData = reminder.reminderData;
      }
    } catch {}

    const reminderDate = new Date(reminderData.datetime);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
    const oneHour = 60 * 60 * 1000;

    if (timeDiff > oneHour) {
      console.warn(`[Reminder Notify] Reminder time is too far from now: ${id}, diff: ${timeDiff}ms`);
      if (reminderDate > now) {
        return NextResponse.json({
          success: false,
          message: "Reminder time has not arrived yet",
          reminderId: id,
        });
      }
    }

    // 通知送信済みフラグを更新
    await db
      .update(reminders)
      .set({
        notified: true,
        notifiedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(reminders.id, reminder.id));

    console.log(`[Reminder Notify] Successfully processed reminder ${id} (notifications disabled)`);

    return NextResponse.json({
      success: true,
      reminderId: id,
      message: "Reminder processed (notifications disabled)",
    });
  } catch (error) {
    console.error(`[Reminder Notify] Error processing reminder:`, error);
    return NextResponse.json(
      {
        error: "Failed to process reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
