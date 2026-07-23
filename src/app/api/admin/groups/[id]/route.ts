import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages, users } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

// GET /api/admin/groups/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
      with: {
        event: { columns: { id: true, name: true, eventDate: true } },
        user: { columns: { id: true, name: true, displayName: true, email: true } }, // leader
        groupMessages: {
          orderBy: asc(groupMessages.createdAt),
          with: {
            user: { columns: { id: true, name: true, displayName: true, email: true } }, // sender
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // メンバー一覧を取得
    const groupMembersList = await db.query.userGroups.findMany({
      where: eq(userGroups.groupId, id),
      with: {
        user: { columns: { id: true, name: true, displayName: true, email: true } },
      },
    });

    const leaderInMembers = groupMembersList.some((gm: any) => gm.userId === group.leaderUserId);
    const membersList: any[] = groupMembersList.map((gm: any) => ({
      id: gm.user.id,
      name: gm.user.name,
      displayName: gm.user.displayName,
      email: gm.user.email,
      status: gm.status,
    }));

    if (!leaderInMembers && group.user) {
      membersList.push({
        id: (group as any).user.id,
        name: (group as any).user.name,
        displayName: (group as any).user.displayName,
        email: (group as any).user.email,
        status: "INTERESTED",
      });

      // リーダーをUserGroupに追加（データ整合性のため）
      try {
        await db.insert(userGroups).values({
          userId: group.leaderUserId,
          groupId: id,
          eventId: group.eventId,
          status: "INTERESTED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // 既に存在する場合は無視
      }
    }

    // メッセージ数
    const msgCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMessages)
      .where(eq(groupMessages.groupId, id));
    const messageCount = msgCountRes[0]?.count || 0;

    const formatted = {
      id: group.id,
      name: group.name,
      theme: group.theme,
      groupCode: group.groupCode,
      maxMembers: group.maxMembers,
      memberCount: membersList.length,
      messageCount,
      event: (group as any).event
        ? {
            id: (group as any).event.id,
            name: (group as any).event.name,
            event_date: new Date((group as any).event.eventDate).toISOString(),
          }
        : null,
      leader: (group as any).user
        ? {
            id: (group as any).user.id,
            name: (group as any).user.name,
            displayName: (group as any).user.displayName,
            email: (group as any).user.email,
          }
        : null,
      members: membersList,
      messages: ((group as any).groupMessages || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isAnnouncement: msg.isAnnouncement,
        sender: msg.user
          ? { id: msg.user.id, name: msg.user.name, displayName: msg.user.displayName, email: msg.user.email }
          : null,
        createdAt: new Date(msg.createdAt).toISOString(),
      })),
      createdAt: new Date(group.createdAt).toISOString(),
    };

    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}
