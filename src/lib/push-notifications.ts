import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";

// VAPIDキーの設定（環境変数から取得）
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || process.env.NEXTAUTH_URL || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn(
    "[Push Notifications] VAPID keys are not set. Push notifications will not work. " +
    "Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables."
  );
}

// Push通知を送信
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  try {
    console.log(`[Push Notification] Sending push notification to user ${userId}: ${title}`);

    // ユーザーのPushサブスクリプションを取得
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: userId },
    });

    console.log(`[Push Notification] Found ${subscriptions.length} subscription(s) for user ${userId}`);

    if (subscriptions.length === 0) {
      console.warn(`[Push Notification] No push subscriptions found for user ${userId}`);
      return { success: false, message: "No push subscriptions found" };
    }

    const payload = JSON.stringify({
      title,
      body,
      tag: "reminder",
      data: data || {},
      // アイコンはオプション（存在する場合のみ）
      // icon: "/icon-192.png",
      // badge: "/icon-192.png",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          console.log(`[Push Notification] Sending to subscription ${subscription.id}`);
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );
          console.log(`[Push Notification] Successfully sent to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`[Push Notification] Failed to send to subscription ${subscription.id}:`, error);
          // 無効なサブスクリプションは削除
          if (error instanceof Error && "statusCode" in error) {
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              console.log(`[Push Notification] Deleting invalid subscription ${subscription.id}`);
              await prisma.pushSubscription.delete({
                where: { id: subscription.id },
              });
            }
          }
          throw error;
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled"
    ).length;

    return {
      success: successful > 0,
      sent: successful,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

// リマインダー通知を送信（Push通知とメール通知）
export async function sendReminderNotification(
  userId: string,
  reminder: {
    id: string;
    label: string;
    datetime: string;
    event: { name: string; id: string } | null;
  },
  userEmail: string,
  notificationSettings: {
    browser_notification_enabled: boolean;
    email_notification_enabled: boolean;
  }
) {
  const eventName = reminder.event?.name || "（イベント未設定）";
  const title = reminder.label;
  // JST（日本標準時）で時刻を表示
  const formattedDateTime = new Date(reminder.datetime).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const body = `${eventName} - ${formattedDateTime}`;
  const reminderUrl = `/app/reminder`;

  const results = {
    push: { success: false, sent: 0 },
    email: { success: false },
  };

  // ブラウザPush通知
  if (notificationSettings.browser_notification_enabled) {
    try {
      console.log(`[Reminder Notification] Sending push notification for reminder ${reminder.id}`);
      const pushResult = await sendPushNotification(userId, title, body, {
        reminderId: reminder.id,
        url: reminderUrl,
      });
      results.push = {
        success: pushResult.success,
        sent: pushResult.sent || 0,
      };
      console.log(`[Reminder Notification] Push notification result:`, pushResult);
    } catch (error) {
      console.error(`[Reminder Notification] Failed to send push notification for reminder ${reminder.id}:`, error);
    }
  } else {
    console.log(`[Reminder Notification] Browser notifications disabled for user ${userId}`);
  }

  // メール通知
  if (notificationSettings.email_notification_enabled) {
    try {
      const emailSubject = `【痛車オーナーズポータル】リマインダー: ${title}`;
      const emailBody = `リマインダーが設定時刻になりました。

${title}
${eventName}
${formattedDateTime}

リマインダーを確認: ${process.env.NEXTAUTH_URL || "https://example.com"}${reminderUrl}

痛車オーナーズポータル`;

      await sendEmail({
        to: userEmail,
        subject: emailSubject,
        body: emailBody,
      });
      results.email.success = true;
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  return results;
}

