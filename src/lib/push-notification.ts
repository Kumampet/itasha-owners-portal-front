import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// VAPIDキーを環境変数から取得
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    publicKey,
    privateKey
  );
}

// プッシュ通知を送信
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  try {
    // ユーザーの通知設定を確認
    const notificationSettings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: userId },
    });

    if (!notificationSettings?.browser_notification_enabled) {
      console.log(`[Push Notification] Browser notifications disabled for user ${userId}`);
      return { success: false, reason: "notifications_disabled" };
    }

    // ユーザーのプッシュサブスクリプションを取得
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[Push Notification] No subscriptions found for user ${userId}`);
      return { success: false, reason: "no_subscriptions" };
    }

    const results = [];

    for (const subscription of subscriptions) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: "/images/main_logo_square.png",
          badge: "/images/main_logo_square.png",
          data: data || {},
        });

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

        results.push({ subscriptionId: subscription.id, success: true });
      } catch (error: unknown) {
        console.error(`[Push Notification] Failed to send to subscription ${subscription.id}:`, error);

        // 410 (Gone) または 404 (Not Found) の場合はサブスクリプションを削除
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          });
          console.log(`[Push Notification] Removed invalid subscription ${subscription.id}`);
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ subscriptionId: subscription.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      success: successCount > 0,
      sent: successCount,
      total: subscriptions.length,
      results,
    };
  } catch (error) {
    console.error("[Push Notification] Error sending push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// 複数のユーザーにプッシュ通知を送信
export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const results = [];

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, title, body, data);
    results.push({ userId, ...result });
  }

  return results;
}

