import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/groups/[id]/members/[userId]
// 管理画面用のユーザー強制離脱API（ADMINユーザーのみ）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
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

    // リーダーは強制離脱できない（リーダー変更APIを使用する必要がある）
    if (group.leader_user_id === userId) {
      return NextResponse.json(
        { error: "Cannot remove the group leader. Please change the leader first." },
        { status: 400 }
      );
    }

    // UserGroupから削除（複数団体参加対応）
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: id,
        },
      },
    });

    if (!userGroup) {
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 404 }
      );
    }

    // UserGroupから削除
    await prisma.userGroup.delete({
      where: {
        user_id_group_id: {
          user_id: userId,
          group_id: id,
        },
      },
    });

    // UserEventのgroup_idも更新（後方互換性のため）
    // 同じイベントで他の団体に参加している場合は、その団体IDを設定
    // 参加していない場合はnullに設定
    const remainingUserGroups = await prisma.userGroup.findMany({
      where: {
        user_id: userId,
        event_id: group.event_id,
      },
      orderBy: {
        created_at: "asc",
      },
      take: 1,
    });

    const userEvent = await prisma.userEvent.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: group.event_id,
        },
      },
    });

    if (userEvent) {
      await prisma.userEvent.update({
        where: {
          user_id_event_id: {
            user_id: userId,
            event_id: group.event_id,
          },
        },
        data: {
          group_id: remainingUserGroups.length > 0 ? remainingUserGroups[0].group_id : null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

