import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/messages/[messageId]/reactions
// リアクションを追加
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // 絵文字の長さをチェック（最大10文字）
    if (Array.from(emoji).length > 10) {
      return NextResponse.json(
        { error: "Emoji is too long" },
        { status: 400 }
      );
    }

    // 団体を取得して、ユーザーがメンバーか確認
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        user_groups: {
          where: {
            user_id: session.user.id,
          },
        },
      },
    });

    if (!group || group.user_groups.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // メッセージが存在するか確認
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.group_id !== id) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // 既存のリアクションを確認（同じユーザーが同じ絵文字を既に付けている場合は削除）
    const existingReaction = await prisma.groupMessageReaction.findUnique({
      where: {
        message_id_user_id_emoji: {
          message_id: messageId,
          user_id: session.user.id,
          emoji: emoji.trim(),
        },
      },
    });

    if (existingReaction) {
      // 既に同じリアクションがある場合は削除（トグル動作）
      await prisma.groupMessageReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({ added: false });
    }

    // リアクションを追加
    await prisma.groupMessageReaction.create({
      data: {
        message_id: messageId,
        user_id: session.user.id,
        emoji: emoji.trim(),
      },
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

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, messageId } = await params;
    const url = new URL(request.url);
    const emoji = url.searchParams.get("emoji");

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // 団体を取得して、ユーザーがメンバーか確認
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        user_groups: {
          where: {
            user_id: session.user.id,
          },
        },
      },
    });

    if (!group || group.user_groups.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // メッセージが存在するか確認
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.group_id !== id) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // リアクションを削除
    const reaction = await prisma.groupMessageReaction.findUnique({
      where: {
        message_id_user_id_emoji: {
          message_id: messageId,
          user_id: session.user.id,
          emoji: emoji.trim(),
        },
      },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    await prisma.groupMessageReaction.delete({
      where: { id: reaction.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return NextResponse.json(
      { error: "Failed to delete reaction" },
      { status: 500 }
    );
  }
}

