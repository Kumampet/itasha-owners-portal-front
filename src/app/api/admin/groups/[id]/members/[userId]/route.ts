import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, userEvents } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// DELETE /api/admin/groups/[id]/members/[userId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.leaderUserId === userId) {
      return NextResponse.json(
        { error: "Cannot remove the group leader. Please change the leader first." },
        { status: 400 }
      );
    }

    const userGroup = await db
      .select()
      .from(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, id)))
      .get();

    if (!userGroup) {
      return NextResponse.json({ error: "User is not a member of this group" }, { status: 404 });
    }

    await db
      .delete(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, id)));

    // 同じイベントの残りの団体を確認
    const remainingUserGroups = await db
      .select()
      .from(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.eventId, group.eventId)))
      .orderBy(asc(userGroups.createdAt));

    // userEventsのgroupIdを更新（後方互換性のため）
    const userEvent = await db
      .select()
      .from(userEvents)
      .where(and(eq(userEvents.userId, userId), eq(userEvents.eventId, group.eventId)))
      .get();

    if (userEvent) {
      await db
        .update(userEvents)
        .set({
          groupId: remainingUserGroups.length > 0 ? remainingUserGroups[0].groupId : null,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(userEvents.userId, userId), eq(userEvents.eventId, group.eventId)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
