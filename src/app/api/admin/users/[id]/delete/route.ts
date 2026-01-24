import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { transferGroupLeadership } from "@/lib/user-utils";

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

    // ユーザー情報を取得
    const userBefore = await prisma.user.findUnique({
      where: { id },
      select: {
        deleted_at: true,
      },
    });

    if (!userBefore) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // リーダーになっているグループのリーダー権限を委譲
    const transferError = await transferGroupLeadership(id, { throwOnError: true });
    if (transferError) {
      return NextResponse.json(
        {
          error: `グループ「${transferError.groupName}」のリーダー権限委譲に失敗しました`,
          message: transferError.message,
        },
        { status: 500 }
      );
    }

    // ユーザーを論理削除（deleted_atを設定）
    await prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      } as { deleted_at: Date },
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

