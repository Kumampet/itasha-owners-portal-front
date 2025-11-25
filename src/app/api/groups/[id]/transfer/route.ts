import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/groups/[id]/transfer
// オーナー権限譲渡
export async function PATCH(
  request: Request,
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
    const body = await request.json();
    const { newLeaderId } = body;

    if (!newLeaderId) {
      return NextResponse.json(
        { error: "newLeaderId is required" },
        { status: 400 }
      );
    }

    // 団体を取得
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // 現在のユーザーがオーナーか確認
    if (group.leader_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group leader can transfer ownership" },
        { status: 403 }
      );
    }

    // 新しいリーダーがメンバーか確認
    const isMember = group.members.some((m) => m.user_id === newLeaderId);
    if (!isMember) {
      return NextResponse.json(
        { error: "The new leader must be a member of the group" },
        { status: 400 }
      );
    }

    // 自分自身に譲渡しようとしている場合はエラー
    if (newLeaderId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot transfer ownership to yourself" },
        { status: 400 }
      );
    }

    // オーナー権限を譲渡
    await prisma.group.update({
      where: { id },
      data: {
        leader_user_id: newLeaderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}

