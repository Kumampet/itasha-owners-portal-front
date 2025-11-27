import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe
// Push通知のサブスクリプションを登録
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

    // 既存のサブスクリプションを確認（upsertを使用）
    await prisma.pushSubscription.upsert({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error && "code" in error ? { code: (error as { code?: string }).code } : {};
    return NextResponse.json(
      { 
        error: "Failed to subscribe to push notifications",
        details: errorMessage,
        ...errorDetails,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe
// Push通知のサブスクリプションを削除
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

    await prisma.pushSubscription.deleteMany({
      where: {
        user_id: userId,
        endpoint: endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    );
  }
}

