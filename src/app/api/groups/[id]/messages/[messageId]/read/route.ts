import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages, groupMessageReads } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/groups/[id]/messages/[messageId]/read
// メッセージを既読にする
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id, messageId } = await params;

    // 団体を取得
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // ユーザーがメンバーかリーダーか確認
    const userGroup = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, id)
        )
      )
      .get();

    const isLeader = group.leaderUserId === userId;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // メッセージが存在するか確認
    const message = await db.query.groupMessages.findFirst({
      where: eq(groupMessages.id, messageId),
    });

    if (!message || message.groupId !== id) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // 既読状態を更新
    await db
      .insert(groupMessageReads)
      .values({
        id: crypto.randomUUID(),
        messageId: messageId,
        userId: userId,
        readAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [groupMessageReads.messageId, groupMessageReads.userId],
        set: {
          readAt: new Date().toISOString(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
