import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reminders/check
// 通知時刻になったリマインダーをチェックして通知を送信
// このエンドポイントは定期的に呼び出される（cronジョブなど）
// TODO: 通知機能（プッシュ通知・メール通知）を削除しました。将来的に再実装する場合は、ここに通知送信ロジックを追加してください。
export async function GET(request: Request) {
  try {
    // 認証チェック（オプション: 環境変数でAPIキーを設定）
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.REMINDER_CHECK_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    // 通知時刻を過ぎたリマインダーを取得（まだ通知していないもの）
    // 過去のリマインダーも含める（最大1時間前まで。それより古いものは削除済み）
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 通知時刻になったリマインダーを取得（まだ通知していないもの）
    const reminders = await prisma.reminder.findMany({
      where: {
        notified: false,
      },
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

    console.log(`[Reminder Check] Found ${reminders.length} un-notified reminders`);
    console.log(`[Reminder Check] Current time: ${now.toISOString()}`);
    console.log(`[Reminder Check] Checking reminders from ${oneHourAgo.toISOString()} to ${now.toISOString()}`);

    // リマインダーデータからdatetimeを取得してフィルタリング
    // 通知時刻を過ぎたリマインダーを対象（過去1時間以内のもの）
    const dueReminders = reminders.filter((reminder) => {
      try {
        const reminderData = reminder.reminder_data as {
          datetime: string;
          label: string;
        };
        const reminderDate = new Date(reminderData.datetime);
        
        // デバッグ: すべてのリマインダーの情報をログに出力
        const timeDiffMinutes = Math.round((reminderDate.getTime() - now.getTime()) / 1000 / 60);
        console.log(`[Reminder Check] Reminder ${reminder.id}:`, {
          datetime: reminderData.datetime,
          parsedDate: reminderDate.toISOString(),
          label: reminderData.label,
          isPast: reminderDate < now,
          timeDiffMinutes: timeDiffMinutes,
        });
        
        // 通知時刻を過ぎたリマインダーを対象（過去1時間以内のもの）
        // これにより、通知時刻を過ぎたリマインダーが確実に通知される
        const isDue = reminderDate <= now && reminderDate >= oneHourAgo;
        if (isDue) {
          console.log(`[Reminder Check] ✅ Found due reminder: ${reminder.id}, datetime: ${reminderData.datetime}, label: ${reminderData.label}, timeDiff: ${timeDiffMinutes} minutes`);
        }
        return isDue;
      } catch (error) {
        console.error(`[Reminder Check] Error parsing reminder ${reminder.id}:`, error);
        return false;
      }
    });

    const results = [];

    for (const reminder of dueReminders) {
      try {
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

        results.push({
          reminderId: reminder.id,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);
        results.push({
          reminderId: reminder.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response = {
      checked: reminders.length,
      due: dueReminders.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      timestamp: now.toISOString(),
    };

    console.log(`[Reminder Check] Checked ${reminders.length} reminders, ${dueReminders.length} due, ${response.sent} processed, ${response.failed} failed`);

    // 処理系のエンドポイントでリアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      response,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error checking reminders:", error);
    return NextResponse.json(
      { error: "Failed to check reminders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
