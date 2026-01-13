import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/users/[id]/delete
// ユーザーを論理削除するAPI
export async function DELETE(
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

    // 自分自身を削除できないようにチェック
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "自分自身を削除することはできません" },
        { status: 400 }
      );
    }

    // ユーザーを論理削除（deleted_atを設定）
    await prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "ユーザーの削除に失敗しました" },
      { status: 500 }
    );
  }
}

