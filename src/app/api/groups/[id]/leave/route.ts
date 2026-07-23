import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, userEvents } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// DELETE /api/groups/[id]/leave
// 団体を抜ける
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // 団体を取得
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // オーナーは解散機能を使用する必要がある
    if (group.leaderUserId === userId) {
      return NextResponse.json(
        { error: "Group leader must use the disband function instead" },
        { status: 400 }
      );
    }

    // UserGroupから削除されているか確認
    const userGroup = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, id)
        )
      )
      .get();

    if (!userGroup) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // UserGroupから削除
    await db
      .delete(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, id)
        )
      );

    // UserEventのgroup_idも更新（後方互換性のため）
    // 同じイベントで他の団体に参加している場合は、その団体IDを設定
    // 参加していない場合はnullに設定
    const remainingUserGroups = await db.query.userGroups.findMany({
      where: and(
        eq(userGroups.userId, userId),
        eq(userGroups.eventId, group.eventId)
      ),
      orderBy: asc(userGroups.createdAt),
      limit: 1,
    });

    const userEvent = await db
      .select()
      .from(userEvents)
      .where(
        and(
          eq(userEvents.userId, userId),
          eq(userEvents.eventId, group.eventId)
        )
      )
      .get();

    if (userEvent) {
      await db
        .update(userEvents)
        .set({
          groupId: remainingUserGroups.length > 0 ? remainingUserGroups[0].groupId : null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(userEvents.userId, userId),
            eq(userEvents.eventId, group.eventId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
}
