import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/users/[id]/permanent-delete
// ユーザーを物理削除するAPI（論理削除されたユーザーのみ）
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

    // 論理削除されているか確認
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        deleted_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.deleted_at) {
      return NextResponse.json(
        { error: "論理削除されていないユーザーは完全削除できません。まず論理削除を行ってください。" },
        { status: 400 }
      );
    }

    // ユーザーを物理削除（関連データもCASCADEで削除される）
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    return NextResponse.json(
      { error: "ユーザーの完全削除に失敗しました" },
      { status: 500 }
    );
  }
}

