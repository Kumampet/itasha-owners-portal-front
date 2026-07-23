import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/reminders/check
// 通知時刻になったリマインダーをチェックして通知を送信
// このエンドポイントは定期的に呼び出される（cronジョブなど）
export async function GET(request: Request) {
  try {
    // 認証チェック
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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 通知時刻になっていないリマインダーをすべて取得（まだ通知していないもの）
    const remindersList = await db.query.reminders.findMany({
      where: eq(reminders.notified, false),
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

    console.log(`[Reminder Check] Found ${remindersList.length} un-notified reminders`);
    console.log(`[Reminder Check] Current time: ${now.toISOString()}`);
    console.log(`[Reminder Check] Checking reminders from ${oneHourAgo.toISOString()} to ${now.toISOString()}`);

    // リマインダーデータからdatetimeを取得してフィルタリング
    // 通知時刻を過ぎたリマインダーを対象（過去1時間以内のもの）
    const dueReminders = remindersList.filter((reminder: any) => {
      try {
        let reminderData: any = {};
        if (typeof reminder.reminderData === "string") {
          reminderData = JSON.parse(reminder.reminderData);
        } else {
          reminderData = reminder.reminderData;
        }

        const reminderDate = new Date(reminderData.datetime);
        
        // デバッグログを出力
        const timeDiffMinutes = Math.round((reminderDate.getTime() - now.getTime()) / 1000 / 60);
        console.log(`[Reminder Check] Reminder ${reminder.id}:`, {
          datetime: reminderData.datetime,
          parsedDate: reminderDate.toISOString(),
          label: reminderData.label,
          isPast: reminderDate < now,
          timeDiffMinutes: timeDiffMinutes,
        });
        
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
        // 通知送信済みフラグを更新
        await db
          .update(reminders)
          .set({
            notified: true,
            notifiedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })
          .where(eq(reminders.id, reminder.id));

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
      checked: remindersList.length,
      due: dueReminders.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      timestamp: now.toISOString(),
    };

    console.log(`[Reminder Check] Checked ${remindersList.length} reminders, ${dueReminders.length} due, ${response.sent} processed, ${response.failed} failed`);

    // キャッシュを無効にする
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
