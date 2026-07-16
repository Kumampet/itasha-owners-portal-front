import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, userEvents } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// DELETE /api/groups/[id]/members/[userId]
// 参加者アプリ用のメンバー強制離脱API（団体リーダーのみ）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, userId } = await params;
    const currentUserId = session.user.id;

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

    // リーダーのみがメンバーを削除可能
    if (group.leaderUserId !== currentUserId) {
      return NextResponse.json(
        { error: "Only the group leader can remove members" },
        { status: 403 }
      );
    }

    // 自分自身を削除しようとしている場合はエラー
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Please transfer ownership first or disband the group." },
        { status: 400 }
      );
    }

    // UserGroupから削除（複数団体参加対応）
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
        { error: "User is not a member of this group" },
        { status: 404 }
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
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
