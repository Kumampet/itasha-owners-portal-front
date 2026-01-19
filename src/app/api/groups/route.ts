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

    const groups = userGroups
      .filter((ug) => ug.group && ug.group.leader && ug.group.event)
      .map((ug) => ({
        id: ug.group!.id,
        name: ug.group!.name,
        theme: ug.group!.theme,
        groupCode: ug.group!.group_code,
        maxMembers: ug.group!.max_members,
        memberCount: ug.group!._count.user_groups,
        isLeader: ug.group!.leader_user_id === session.user.id,
        event: ug.group!.event,
        leader: ug.group!.leader,
        createdAt: ug.group!.created_at,
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
    // エラーの詳細をログに記録（本番環境でのデバッグ用）
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

