import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/reminders/notify/[id]
// EventBridge Schedulerから呼び出される通知送信エンドポイント
// TODO: 通知機能（プッシュ通知・メール通知）を削除しました。将来的に再実装する場合は、ここに通知送信ロジックを追加してください。
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック（APIキーまたは内部リクエストのみ許可）
    const authHeader = _request.headers.get("authorization");
    // 環境変数から取得したAPIキーをトリム（前後の空白文字を削除）
    const apiKey = process.env.REMINDER_NOTIFY_API_KEY?.trim();
    
    // デバッグログ
    console.log('[Notify API] REMINDER_NOTIFY_API_KEY is set:', !!apiKey);
    if (apiKey) {
      console.log('[Notify API] REMINDER_NOTIFY_API_KEY length:', apiKey.length);
      console.log('[Notify API] REMINDER_NOTIFY_API_KEY first 10 chars:', apiKey.substring(0, 10));
      console.log('[Notify API] REMINDER_NOTIFY_API_KEY last 10 chars:', apiKey.substring(apiKey.length - 10));
    }
    console.log('[Notify API] Authorization header received:', authHeader ? 'present' : 'missing');
    if (authHeader) {
      console.log('[Notify API] Authorization header length:', authHeader.length);
      // Bearer プレフィックスを削除してAPIキー部分を取得
      const receivedKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
      console.log('[Notify API] Received key length:', receivedKey.length);
      console.log('[Notify API] Received key first 10 chars:', receivedKey.substring(0, 10));
      console.log('[Notify API] Received key last 10 chars:', receivedKey.substring(receivedKey.length - 10));
    }
    
    if (apiKey) {
      // AuthorizationヘッダーからBearerプレフィックスを削除して比較
      const receivedKey = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7).trim() 
        : authHeader?.trim() || '';
      
      if (receivedKey !== apiKey) {
        console.error('[Notify API] Authentication failed');
        console.error('[Notify API] Expected key length:', apiKey.length);
        console.error('[Notify API] Received key length:', receivedKey.length);
        console.error('[Notify API] Expected key first 10 chars:', apiKey.substring(0, 10));
        console.error('[Notify API] Received key first 10 chars:', receivedKey.substring(0, 10));
        console.error('[Notify API] Expected key last 10 chars:', apiKey.substring(apiKey.length - 10));
        console.error('[Notify API] Received key last 10 chars:', receivedKey.substring(receivedKey.length - 10));
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
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

    // TODO: 通知送信機能を削除しました。将来的に再実装する場合は、ここに通知送信ロジックを追加してください。
    // 現在は通知送信済みフラグのみを更新します。

    // 通知送信済みフラグを更新
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        notified: true,
        notified_at: now,
      },
    });

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
