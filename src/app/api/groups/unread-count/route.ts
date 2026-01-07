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
    return NextResponse.json(
      { error: "Failed to fetch unread counts" },
      { status: 500 }
    );
  }
}

