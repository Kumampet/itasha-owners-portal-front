import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/groups/[id]/members/[userId]
// 参加者アプリ用のメンバー強制離脱API（団体リーダーのみ）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, userId } = await params;

    // 団体を取得
    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // リーダーのみがメンバーを削除可能
    if (group.leader_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group leader can remove members" },
        { status: 403 }
      );
    }

    // 自分自身を削除しようとしている場合はエラー
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Please transfer ownership first or disband the group." },
        { status: 400 }
      );
    }

    // UserEventを取得
    const userEvent = await prisma.userEvent.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: group.event_id,
        },
      },
    });

    if (!userEvent || userEvent.group_id !== id) {
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 404 }
      );
    }

    // UserEventからgroup_idを削除（nullに更新）
    await prisma.userEvent.update({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: group.event_id,
        },
      },
      data: {
        group_id: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

