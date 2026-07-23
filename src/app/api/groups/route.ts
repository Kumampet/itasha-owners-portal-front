import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userGroups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/groups
// ユーザーが参加している団体一覧を取得
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ユーザーが参加している団体を取得
    const userGroupsList = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, userId),
      orderBy: desc(userGroups.createdAt),
      with: {
        group: {
          with: {
            event: {
              columns: {
                id: true,
                name: true,
                eventDate: true,
              },
            },
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
            userGroups: {
              columns: {
                userId: true,
              },
            },
          },
        },
      },
    });

    const groups = userGroupsList
      .filter((ug: any) => ug.group !== null)
      .map((ug: any) => {
        const group = ug.group!;
        const leader = group.user; // Drizzle relations mapping for leaderUserId -> user
        
        return {
          id: group.id,
          name: group.name,
          theme: group.theme,
          groupCode: group.groupCode,
          maxMembers: group.maxMembers,
          memberCount: group.userGroups?.length || 0,
          isLeader: group.leaderUserId === userId,
          event: group.event ? {
            id: group.event.id,
            name: group.event.name,
            event_date: new Date(group.event.eventDate).toISOString(),
          } : null,
          leader: leader ? {
            id: leader.id,
            name: leader.name,
            email: leader.email,
          } : null,
          createdAt: new Date(group.createdAt).toISOString(),
        };
      });

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      groups,
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching groups:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch groups",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
