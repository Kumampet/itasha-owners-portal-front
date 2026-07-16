import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/admin/groups/[id]/leader
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
    const { newLeaderId } = body;

    if (!newLeaderId) {
      return NextResponse.json({ error: "newLeaderId is required" }, { status: 400 });
    }

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // 新しいリーダーがメンバーか確認
    const memberRecord = await db
      .select({ userId: userGroups.userId })
      .from(userGroups)
      .where(and(eq(userGroups.groupId, id), eq(userGroups.userId, newLeaderId)))
      .get();

    if (!memberRecord) {
      return NextResponse.json(
        { error: "The new leader must be a member of the group" },
        { status: 400 }
      );
    }

    await db
      .update(groups)
      .set({ leaderUserId: newLeaderId, updatedAt: new Date().toISOString() })
      .where(eq(groups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing leader:", error);
    return NextResponse.json({ error: "Failed to change leader" }, { status: 500 });
  }
}
