import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/groups
// 管理画面用の団体一覧取得API（ADMINユーザーのみ）
export async function GET(request: Request) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search");

    // フィルター条件を構築
    const where: Record<string, unknown> = {};
    if (eventId) {
      where.event_id = eventId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { group_code: { contains: search } },
        { theme: { contains: search } },
      ];
    }

    const groups = await prisma.group.findMany({
      where,
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
            display_name: true,
            email: true,
          },
        },
        _count: {
          select: {
            user_groups: true,
            messages: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      groups.map((group) => ({
        id: group.id,
        name: group.name,
        theme: group.theme,
        groupCode: group.group_code,
        maxMembers: group.max_members,
        memberCount: group._count.user_groups,
        messageCount: group._count.messages,
        event: group.event,
        leader: {
          id: group.leader.id,
          name: group.leader.name,
          displayName: group.leader.display_name,
          email: group.leader.email,
        },
        createdAt: group.created_at,
      })),
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
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

