import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/unread-count
// ユーザーが参加している団体の未読メッセージ数を取得
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // prismaインスタンスの確認
    if (!prisma) {
      console.error("[unread-count] Prisma client is undefined");
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    if (!prisma.userEvent) {
      console.error("[unread-count] prisma.userEvent is undefined");
      return NextResponse.json(
        { error: "Database model not available" },
        { status: 500 }
      );
    }

    // ユーザーが参加している団体を取得
    const userEvents = await prisma.userEvent.findMany({
      where: {
        user_id: session.user.id,
        group_id: {
          not: null,
        },
      },
      include: {
        group: {
          select: {
            id: true,
          },
        },
      },
    });

    const groupIds = userEvents
      .filter((ue) => ue.group)
      .map((ue) => ue.group!.id);

    if (groupIds.length === 0) {
      return NextResponse.json({});
    }

    // 各団体の未読メッセージ数を取得
    const unreadCounts: Record<string, boolean> = {};

    for (const groupId of groupIds) {
      // 団体の最新メッセージを取得
      const latestMessage = await prisma.groupMessage.findFirst({
        where: { group_id: groupId },
        orderBy: { created_at: "desc" },
        select: { id: true, created_at: true },
      });

      if (!latestMessage) {
        continue;
      }

      // ユーザーが最新メッセージを既読か確認
      if (!prisma.groupMessageRead) {
        console.error("[unread-count] prisma.groupMessageRead is undefined");
        continue;
      }

      const readRecord = await prisma.groupMessageRead.findUnique({
        where: {
          message_id_user_id: {
            message_id: latestMessage.id,
            user_id: session.user.id,
          },
        },
      });

      // 未読の場合はtrue、既読の場合はfalse
      unreadCounts[groupId] = !readRecord;
    }

    return NextResponse.json(unreadCounts);
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Prisma関連のエラーの場合、より詳細な情報を返す
    if (error && typeof error === "object" && "code" in error) {
      return NextResponse.json(
        { 
          error: "Database error",
          code: (error as { code?: string }).code,
          message: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch unread counts",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

