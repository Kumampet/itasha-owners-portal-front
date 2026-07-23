import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/admin/users/[id]/display-name
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { displayName } = body;

    if (displayName !== null && displayName !== undefined && typeof displayName !== "string") {
      return NextResponse.json({ error: "displayName must be a string or null" }, { status: 400 });
    }

    if (displayName && typeof displayName === "string") {
      const charCount = Array.from(displayName.trim()).length;
      if (charCount > 50) {
        return NextResponse.json({ error: "Display name must be 50 characters or less" }, { status: 400 });
      }
    }

    const newDisplayName = displayName && typeof displayName === "string"
      ? displayName.trim() || null
      : null;

    await db
      .update(users)
      .set({ displayName: newDisplayName, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    const user = await db
      .select({
        id: users.id, email: users.email, name: users.name, displayName: users.displayName,
        role: users.role, isBanned: users.isBanned, createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    const formatted = user ? {
      id: user.id, email: user.email, name: user.name, display_name: user.displayName,
      role: user.role, is_banned: user.isBanned, created_at: new Date(user.createdAt).toISOString(),
    } : null;

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error updating display name:", error);
    return NextResponse.json({ error: "表示名の更新に失敗しました" }, { status: 500 });
  }
}
