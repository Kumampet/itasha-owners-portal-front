import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/groups/[id]/leave
// 団体を抜ける
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // オーナーは解散機能を使用する必要がある
    if (group.leader_user_id === session.user.id) {
      return NextResponse.json(
        { error: "Group leader must use the disband function instead" },
        { status: 400 }
      );
    }

    // UserGroupから削除（複数団体参加対応）
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        user_id_group_id: {
          user_id: session.user.id,
          group_id: id,
        },
      },
    });

    if (!userGroup) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // UserGroupから削除
    await prisma.userGroup.delete({
      where: {
        user_id_group_id: {
          user_id: session.user.id,
          group_id: id,
        },
      },
    });

    // UserEventのgroup_idも更新（後方互換性のため）
    // 同じイベントで他の団体に参加している場合は、その団体IDを設定
    // 参加していない場合はnullに設定
    const remainingUserGroups = await prisma.userGroup.findMany({
      where: {
        user_id: session.user.id,
        event_id: group.event_id,
      },
      orderBy: {
        created_at: "asc", // 最初に参加した団体を優先
      },
      take: 1,
    });

    const userEvent = await prisma.userEvent.findUnique({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: group.event_id,
        },
      },
    });

    if (userEvent) {
      await prisma.userEvent.update({
        where: {
          user_id_event_id: {
            user_id: session.user.id,
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
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
}

