import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages, groupMessageReads } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/groups/[id]/messages/read-all
// 団体のすべてのメッセージを既読にする
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

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

    // 団体のすべてのメッセージを取得
    const messagesList = await db
      .select({ id: groupMessages.id })
      .from(groupMessages)
      .where(eq(groupMessages.groupId, id));

    const now = new Date();

    // すべてのメッセージを既読にする (一括挿入 / 更新)
    if (messagesList.length > 0) {
      const values = messagesList.map((msg: any) => ({
        id: crypto.randomUUID(),
        messageId: msg.id,
        userId: userId,
        readAt: now.toISOString(),
      }));

      await db
        .insert(groupMessageReads)
        .values(values)
        .onConflictDoUpdate({
          target: [groupMessageReads.messageId, groupMessageReads.userId],
          set: {
            readAt: now.toISOString(),
          },
        });
    }

    return NextResponse.json({ success: true, count: messagesList.length });
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all messages as read" },
      { status: 500 }
    );
  }
}
