import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages, groupMessageReactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/groups/[id]/messages/[messageId]/reactions
// リアクションを追加
export async function POST(
  request: Request,
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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // 絵文字の長さをチェック
    if (Array.from(emoji).length > 10) {
      return NextResponse.json(
        { error: "Emoji is too long" },
        { status: 400 }
      );
    }

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

    // 自分のメッセージにはリアクションを付けられない
    if (message.senderId === userId) {
      return NextResponse.json(
        { error: "You cannot react to your own message" },
        { status: 403 }
      );
    }

    // 既存のリアクションを確認（同じユーザーが同じ絵文字を既に付けている場合は削除：トグル）
    const existingReaction = await db
      .select()
      .from(groupMessageReactions)
      .where(
        and(
          eq(groupMessageReactions.messageId, messageId),
          eq(groupMessageReactions.userId, userId),
          eq(groupMessageReactions.emoji, emoji.trim())
        )
      )
      .get();

    if (existingReaction) {
      await db
        .delete(groupMessageReactions)
        .where(eq(groupMessageReactions.id, existingReaction.id));

      return NextResponse.json({ added: false });
    }

    // リアクションを追加
    await db.insert(groupMessageReactions).values({
      id: crypto.randomUUID(),
      messageId: messageId,
      userId: userId,
      emoji: emoji.trim(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ added: true });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/messages/[messageId]/reactions
// リアクションを削除
export async function DELETE(
  request: Request,
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
    const url = new URL(request.url);
    const emoji = url.searchParams.get("emoji");

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

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

    // 自分のメッセージにはリアクションを削除できない
    if (message.senderId === userId) {
      return NextResponse.json(
        { error: "You cannot delete reactions from your own message" },
        { status: 403 }
      );
    }

    // リアクションを検索
    const reaction = await db
      .select()
      .from(groupMessageReactions)
      .where(
        and(
          eq(groupMessageReactions.messageId, messageId),
          eq(groupMessageReactions.userId, userId),
          eq(groupMessageReactions.emoji, emoji.trim())
        )
      )
      .get();

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    await db
      .delete(groupMessageReactions)
      .where(eq(groupMessageReactions.id, reaction.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return NextResponse.json(
      { error: "Failed to delete reaction" },
      { status: 500 }
    );
  }
}
