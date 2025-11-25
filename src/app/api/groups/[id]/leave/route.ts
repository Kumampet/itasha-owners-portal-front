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

    // UserEventからgroup_idを削除（nullに更新）
    const userEvent = await prisma.userEvent.findUnique({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: group.event_id,
        },
      },
    });

    if (!userEvent || userEvent.group_id !== id) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    await prisma.userEvent.update({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: group.event_id,
        },
      },
      data: {
        group_id: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
}

