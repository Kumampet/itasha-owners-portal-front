import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // サブスクリプションを登録または更新
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        user_id_endpoint: {
          user_id: userId,
          endpoint: endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        user_id: userId,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true, subscription });
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
    await prisma.pushSubscription.deleteMany({
      where: {
        user_id: userId,
        endpoint: endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete push subscription" },
      { status: 500 }
    );
  }
}

