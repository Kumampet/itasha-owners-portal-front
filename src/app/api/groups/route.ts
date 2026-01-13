import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups
// ユーザーが参加している団体一覧を取得
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ユーザーが参加している団体を取得
    const userEvents = await prisma.userEvent.findMany({
      where: {
        user_id: session.user.id,
        group_id: {
          not: null,
        },
      },
      include: {
        group: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                event_date: true,
              },
            },
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    const groups = userEvents
      .filter((ue) => ue.group)
      .map((ue) => ({
        id: ue.group!.id,
        name: ue.group!.name,
        theme: ue.group!.theme,
        groupCode: ue.group!.group_code,
        maxMembers: ue.group!.max_members,
        memberCount: ue.group!._count.members,
        isLeader: ue.group!.leader_user_id === session.user.id,
        event: ue.group!.event,
        leader: ue.group!.leader,
        createdAt: ue.group!.created_at,
      }));

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
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

