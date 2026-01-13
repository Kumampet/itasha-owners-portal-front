import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/users/[id]/display-name
// 管理者がユーザーの表示名を変更するAPI
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
    const { displayName } = body;

    if (displayName !== null && displayName !== undefined && typeof displayName !== "string") {
      return NextResponse.json(
        { error: "displayName must be a string or null" },
        { status: 400 }
      );
    }

    // 表示名が文字列の場合、全角50文字以内に制限
    if (displayName && typeof displayName === "string") {
      const charCount = Array.from(displayName.trim()).length;
      if (charCount > 50) {
        return NextResponse.json(
          { error: "Display name must be 50 characters or less" },
          { status: 400 }
        );
      }
    }

    // 表示名を更新
    const user = await prisma.user.update({
      where: { id },
      data: {
        display_name: displayName && typeof displayName === "string" ? displayName.trim() || null : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        display_name: true,
        role: true,
        is_banned: true,
        created_at: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating display name:", error);
    return NextResponse.json(
      { error: "表示名の更新に失敗しました" },
      { status: 500 }
    );
  }
}

