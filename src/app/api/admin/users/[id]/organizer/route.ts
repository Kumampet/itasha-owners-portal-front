import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/users/[id]/organizer
// ユーザーの主催者権限を更新するAPI
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

    const user = await prisma.user.update({
      where: { id },
      data: { is_organizer: body.is_organizer },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_organizer: true,
        is_banned: true,
        created_at: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user organizer status:", error);
    return NextResponse.json(
      { error: "Failed to update user organizer status" },
      { status: 500 }
    );
  }
}

