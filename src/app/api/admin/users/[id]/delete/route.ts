import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { transferGroupLeadership } from "@/lib/user-utils";

// DELETE /api/admin/users/[id]/delete
// ユーザーを論理削除するAPI
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 400 });
    }

    const userBefore = await db
      .select({ deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!userBefore) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const transferError = await transferGroupLeadership(id, { throwOnError: true });
    if (transferError) {
      return NextResponse.json(
        { error: `グループ「${transferError.groupName}」のリーダー権限委譲に失敗しました`, message: transferError.message },
        { status: 500 }
      );
    }

    await db
      .update(users)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "ユーザーの削除に失敗しました" }, { status: 500 });
  }
}
