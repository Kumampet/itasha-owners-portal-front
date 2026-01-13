import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    let settings = await prisma.userNotificationSettings.findUnique({
      where: { user_id: userId },
    });

    // 設定が存在しない場合はデフォルト値で作成
    if (!settings) {
      settings = await prisma.userNotificationSettings.create({
        data: {
          user_id: userId,
          browser_notification_enabled: false,
          email_notification_enabled: false,
        },
      });
    }

    // リアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      settings,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
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

    const settings = await prisma.userNotificationSettings.upsert({
      where: { user_id: userId },
      update: {
        browser_notification_enabled: body.browser_notification_enabled ?? false,
        email_notification_enabled: body.email_notification_enabled ?? false,
      },
      create: {
        user_id: userId,
        browser_notification_enabled: body.browser_notification_enabled ?? false,
        email_notification_enabled: body.email_notification_enabled ?? false,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}

