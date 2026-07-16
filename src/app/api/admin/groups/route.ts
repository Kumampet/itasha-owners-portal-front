import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages, users } from "@/db/schema";
import { eq, and, or, desc, asc, like, sql } from "drizzle-orm";

// GET /api/admin/groups
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search");

    const andConditions: any[] = [];
    if (eventId) andConditions.push(eq(groups.eventId, eventId));
    if (search) {
      andConditions.push(
        or(
          like(groups.name, `%${search}%`),
          like(groups.groupCode, `%${search}%`),
          like(groups.theme, `%${search}%`)
        )
      );
    }

    const groupsList = await db.query.groups.findMany({
      where: andConditions.length > 0 ? and(...andConditions) : undefined,
      orderBy: desc(groups.createdAt),
      with: {
        event: {
          columns: { id: true, name: true, eventDate: true },
        },
        user: { // leader
          columns: { id: true, name: true, displayName: true, email: true },
        },
      },
    });

    // メンバー数とメッセージ数を個別に取得
    const memberCounts = await db
      .select({ groupId: userGroups.groupId, count: sql<number>`count(*)` })
      .from(userGroups)
      .groupBy(userGroups.groupId);
    const messageCounts = await db
      .select({ groupId: groupMessages.groupId, count: sql<number>`count(*)` })
      .from(groupMessages)
      .groupBy(groupMessages.groupId);

    const memberMap = Object.fromEntries(memberCounts.map((r) => [r.groupId, r.count]));
    const messageMap = Object.fromEntries(messageCounts.map((r) => [r.groupId, r.count]));

    const formatted = groupsList.map((g: any) => ({
      id: g.id,
      name: g.name,
      theme: g.theme,
      groupCode: g.groupCode,
      maxMembers: g.maxMembers,
      memberCount: memberMap[g.id] || 0,
      messageCount: messageMap[g.id] || 0,
      event: g.event
        ? { id: g.event.id, name: g.event.name, event_date: new Date(g.event.eventDate).toISOString() }
        : null,
      leader: g.user
        ? { id: g.user.id, name: g.user.name, displayName: g.user.displayName, email: g.user.email }
        : null,
      createdAt: new Date(g.createdAt).toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}
