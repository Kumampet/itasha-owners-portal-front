import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/groups/[id]/leader
// 管理画面用のリーダー変更API（ADMINユーザーのみ）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // 新しいリーダーがメンバーか確認
    const isMember = group.members.some((m) => m.user_id === newLeaderId);
    if (!isMember) {
      return NextResponse.json(
        { error: "The new leader must be a member of the group" },
        { status: 400 }
      );
    }

    // リーダーを変更
    await prisma.group.update({
      where: { id },
      data: {
        leader_user_id: newLeaderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing leader:", error);
    return NextResponse.json(
      { error: "Failed to change leader" },
      { status: 500 }
    );
  }
}

