import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, userEvents } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

// POST /api/groups/join
// 既存団体への加入API
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { groupCode, force } = body;

    if (!groupCode) {
      return NextResponse.json(
        { error: "groupCode is required" },
        { status: 400 }
      );
    }

    // 団体コードで団体を検索
    const group = await db.query.groups.findFirst({
      where: eq(groups.groupCode, groupCode),
      with: {
        event: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const eventId = group.eventId;

    // 既にこの特定の団体に参加しているか確認（重複加入チェック）
    const existingUserGroup = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, group.id)
        )
      )
      .get();

    if (existingUserGroup) {
      return NextResponse.json(
        { error: "Already joined this group" },
        { status: 400 }
      );
    }

    // 同一イベントで既に別の団体に参加しているか確認（警告用）
    const otherUserGroupsInSameEvent = await db.query.userGroups.findMany({
      where: () => and(
        eq(userGroups.userId, userId),
        eq(userGroups.eventId, eventId),
        ne(userGroups.groupId, group.id)
      ),
      with: {
        group: {
          columns: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
      },
    });

    let warningMessage: string | null = null;
    if (otherUserGroupsInSameEvent.length > 0) {
      const groupNames = otherUserGroupsInSameEvent.map((ug: any) => ug.group.name).join("、");
      const eventName = group.event?.name || "イベント";
      warningMessage = `既に同一イベント（${eventName}）の他の団体（${groupNames}）に参加しています。`;

      // 警告がある場合、forceパラメータがない限り、加入処理を中断して警告を返す
      if (!force) {
        return NextResponse.json({
          warning: warningMessage,
          requiresConfirmation: true,
          groupId: group.id,
        });
      }
    }

    // 最大メンバー数チェック
    if (group.maxMembers) {
      const countRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(userGroups)
        .where(eq(userGroups.groupId, group.id));
      const memberCount = countRes[0]?.count || 0;

      if (memberCount >= group.maxMembers) {
        return NextResponse.json(
          { error: "Group is full" },
          { status: 400 }
        );
      }
    }

    // UserGroupを作成
    await db.insert(userGroups).values({
      userId,
      groupId: group.id,
      eventId: eventId,
      status: "INTERESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // UserEventも作成または更新
    await db
      .insert(userEvents)
      .values({
        userId,
        eventId: eventId,
        groupId: group.id,
        status: "INTERESTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [userEvents.userId, userEvents.eventId],
        set: {
          groupId: group.id,
          updatedAt: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      warning: warningMessage,
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
