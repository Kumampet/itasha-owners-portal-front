import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/user/push-subscription
// プッシュ通知のサブスクリプションを登録
export async function POST(request: Request) {
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
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const nowStr = new Date().toISOString();

    // サブスクリプションを登録または更新
    await db
      .insert(pushSubscriptions)
      .values({
        id: crypto.randomUUID(),
        userId: userId,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        createdAt: nowStr,
        updatedAt: nowStr,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
        set: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: nowStr,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push subscription:", error);
    return NextResponse.json(
      { error: "Failed to register push subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/push-subscription
// プッシュ通知のサブスクリプションを削除
export async function DELETE(request: Request) {
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
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // サブスクリプションを削除
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete push subscription" },
      { status: 500 }
    );
  }
}
