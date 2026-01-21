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

    // ユーザーが参加している団体を取得（複数団体参加対応：UserGroupテーブルを使用）
    const userGroups = await prisma.userGroup.findMany({
      where: {
        user_id: session.user.id,
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
                // UserGroupテーブルからメンバー数をカウント
                user_groups: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // groupがnullの場合は除外（削除された団体のUserGroupレコードが残っている場合の対策）
    const groups = userGroups
      .filter((ug) => ug.group !== null)
      .map((ug) => {
        const group = ug.group!;
        return {
          id: group.id,
          name: group.name,
          theme: group.theme,
          groupCode: group.group_code,
          maxMembers: group.max_members,
          memberCount: group._count.user_groups,
          isLeader: group.leader_user_id === session.user.id,
          event: group.event,
          leader: group.leader,
          createdAt: group.created_at,
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

