import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderNotification } from "@/lib/push-notifications";

// POST /api/reminders/notify/[id]
// EventBridge Schedulerから呼び出される通知送信エンドポイント
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック（APIキーまたは内部リクエストのみ許可）
    const authHeader = _request.headers.get("authorization");
    const apiKey = process.env.REMINDER_NOTIFY_API_KEY;
    
    // デバッグログ
    console.log('[Notify API] REMINDER_NOTIFY_API_KEY is set:', !!apiKey);
    if (apiKey) {
      console.log('[Notify API] REMINDER_NOTIFY_API_KEY length:', apiKey.length);
    }
    console.log('[Notify API] Authorization header received:', authHeader ? 'present' : 'missing');
    if (authHeader) {
      console.log('[Notify API] Authorization header length:', authHeader.length);
    }
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      console.error('[Notify API] Authentication failed');
      console.error('[Notify API] Expected:', `Bearer ${apiKey}`);
      console.error('[Notify API] Received:', authHeader);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // リマインダーを取得
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        event: {
          select: {
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
    const reminderData = reminder.reminder_data as {
      datetime: string;
      label: string;
    };

    // 通知時刻を確認（1時間以内の誤差を許容）
    const reminderDate = new Date(reminderData.datetime);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
    const oneHour = 60 * 60 * 1000;

    if (timeDiff > oneHour) {
      console.warn(`[Reminder Notify] Reminder time is too far from now: ${id}, diff: ${timeDiff}ms`);
      // 通知時刻を過ぎている場合は通知を送信（最大1時間前まで）
      if (reminderDate > now) {
        return NextResponse.json({
          success: false,
          message: "Reminder time has not arrived yet",
          reminderId: id,
        });
      }
    }

    // ユーザーの通知設定を取得
    const notificationSettings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: reminder.user_id },
    });

    // デフォルト設定（通知設定が存在しない場合）
    const settings = notificationSettings || {
      browser_notification_enabled: true,
      email_notification_enabled: true,
    };

    // 通知を送信
    const results = await sendReminderNotification(
      reminder.user_id,
      {
        id: reminder.id,
        label: reminderData.label,
        datetime: reminderData.datetime,
        event: reminder.event
          ? {
              id: reminder.event.id,
              name: reminder.event.name,
            }
          : null,
      },
      reminder.user.email,
      settings
    );

    // 通知送信済みフラグを更新
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        notified: true,
        notified_at: now,
      },
    });

    console.log(`[Reminder Notify] Successfully sent notification for reminder ${id}`);

    return NextResponse.json({
      success: true,
      reminderId: id,
      results,
    });
  } catch (error) {
    console.error(`[Reminder Notify] Error sending notification:`, error);
    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

