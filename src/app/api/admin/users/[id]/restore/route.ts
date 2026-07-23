import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/admin/users/[id]/restore
// 論理削除されたユーザーを復帰させるAPI
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .update(users)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    const user = await db
      .select({
        id: users.id, email: users.email, name: users.name, displayName: users.displayName,
        role: users.role, isBanned: users.isBanned, deletedAt: users.deletedAt, createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    const formatted = user ? {
      id: user.id, email: user.email, name: user.name, display_name: user.displayName,
      role: user.role, is_banned: user.isBanned,
      deleted_at: user.deletedAt ? new Date(user.deletedAt).toISOString() : null,
      created_at: new Date(user.createdAt).toISOString(),
    } : null;

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error restoring user:", error);
    return NextResponse.json({ error: "ユーザーの復帰に失敗しました" }, { status: 500 });
  }
}
