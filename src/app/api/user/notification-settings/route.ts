import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userNotificationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user/notification-settings
// ユーザーの通知設定を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    let settings = await db.query.userNotificationSettings.findFirst({
      where: eq(userNotificationSettings.userId, userId),
    });

    // 設定が存在しない場合はデフォルト値で作成
    if (!settings) {
      const settingsId = crypto.randomUUID();
      const nowStr = new Date().toISOString();
      await db.insert(userNotificationSettings).values({
        id: settingsId,
        userId: userId,
        browserNotificationEnabled: false,
        emailNotificationEnabled: true,
        groupMessageUnreadNotificationEnabled: true,
        createdAt: nowStr,
        updatedAt: nowStr,
      });

      settings = {
        id: settingsId,
        userId: userId,
        browserNotificationEnabled: false,
        emailNotificationEnabled: true,
        groupMessageUnreadNotificationEnabled: true,
        createdAt: nowStr,
        updatedAt: nowStr,
      } as any;
    }

    return NextResponse.json(
      {
        id: settings.id,
        user_id: settings.userId,
        browser_notification_enabled: settings.browserNotificationEnabled,
        email_notification_enabled: settings.emailNotificationEnabled,
        group_message_unread_notification_enabled: settings.groupMessageUnreadNotificationEnabled,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch notification settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user/notification-settings
// ユーザーの通知設定を更新
export async function PATCH(request: Request) {
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

    const browserVal = body.browser_notification_enabled ?? false;
    const emailVal = body.email_notification_enabled ?? true;
    const unreadVal = body.group_message_unread_notification_enabled ?? true;

    const settingsId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    await db
      .insert(userNotificationSettings)
      .values({
        id: settingsId,
        userId: userId,
        browserNotificationEnabled: browserVal,
        emailNotificationEnabled: emailVal,
        groupMessageUnreadNotificationEnabled: unreadVal,
        createdAt: nowStr,
        updatedAt: nowStr,
      })
      .onConflictDoUpdate({
        target: userNotificationSettings.userId,
        set: {
          browserNotificationEnabled: browserVal,
          emailNotificationEnabled: emailVal,
          groupMessageUnreadNotificationEnabled: unreadVal,
          updatedAt: nowStr,
        },
      });

    return NextResponse.json({
      user_id: userId,
      browser_notification_enabled: browserVal,
      email_notification_enabled: emailVal,
      group_message_unread_notification_enabled: unreadVal,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to update notification settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
