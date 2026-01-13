import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/users/[id]/restore
// 論理削除されたユーザーを復帰させるAPI
export async function POST(
  _request: Request,
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

    // ユーザーを復帰（deleted_atをnullに設定）
    const user = await prisma.user.update({
      where: { id },
      data: {
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        display_name: true,
        role: true,
        is_banned: true,
        deleted_at: true,
        created_at: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error restoring user:", error);
    return NextResponse.json(
      { error: "ユーザーの復帰に失敗しました" },
      { status: 500 }
    );
  }
}

