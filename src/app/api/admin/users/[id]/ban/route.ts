import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/admin/users/[id]/ban
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

    await db
      .update(users)
      .set({ isBanned: body.is_banned, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));

    const user = await db
      .select({
        id: users.id, email: users.email, name: users.name, role: users.role,
        isBanned: users.isBanned, createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    const formatted = user ? {
      id: user.id, email: user.email, name: user.name, role: user.role,
      is_banned: user.isBanned, created_at: new Date(user.createdAt).toISOString(),
    } : null;

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error updating user ban status:", error);
    return NextResponse.json({ error: "Failed to update user ban status" }, { status: 500 });
  }
}
