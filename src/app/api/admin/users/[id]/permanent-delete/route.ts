import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { transferGroupLeadership } from "@/lib/user-utils";

// DELETE /api/admin/users/[id]/permanent-delete
// ユーザーを物理削除するAPI（論理削除されたユーザーのみ）
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

    const user = await db
      .select({ deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { error: "論理削除されていないユーザーは完全削除できません。まず論理削除を行ってください。" },
        { status: 400 }
      );
    }

    await transferGroupLeadership(id, { throwOnError: false });
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    return NextResponse.json({ error: "ユーザーの完全削除に失敗しました" }, { status: 500 });
  }
}
