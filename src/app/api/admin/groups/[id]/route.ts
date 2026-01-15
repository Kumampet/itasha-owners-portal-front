import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/groups/[id]
// 管理画面用の団体詳細取得API（ADMINユーザーのみ）
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 団体を取得
    const group = await prisma.group.findUnique({
      where: { id },
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
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                display_name: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
        _count: {
          select: {
            user_groups: true,
            messages: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // メンバー一覧を取得（UserGroupテーブルから）
    const groupMembers = await prisma.userGroup.findMany({
      where: {
        group_id: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    // リーダーがUserGroupに存在しない場合、リーダーもメンバー一覧に追加
    const leaderInMembers = groupMembers.some((gm) => gm.user_id === group.leader_user_id);
    const membersList = groupMembers.map((gm) => ({
      id: gm.user.id,
      name: gm.user.name,
      displayName: gm.user.display_name,
      email: gm.user.email,
      status: gm.status,
    }));

    if (!leaderInMembers) {
      // リーダーをメンバー一覧に追加
      membersList.push({
        id: group.leader.id,
        name: group.leader.name,
        displayName: group.leader.display_name,
        email: group.leader.email,
        status: "INTERESTED",
      });

      // リーダーをUserGroupに追加（データ整合性のため）
      try {
        await prisma.userGroup.create({
          data: {
            user_id: group.leader_user_id,
            group_id: id,
            event_id: group.event_id,
            status: "INTERESTED",
          },
        });
      } catch {
        // 既に存在する場合は無視
      }
    }

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      {
        id: group.id,
        name: group.name,
        theme: group.theme,
        groupCode: group.group_code,
        maxMembers: group.max_members,
        memberCount: membersList.length,
        messageCount: group._count.messages,
        event: group.event,
        leader: {
          id: group.leader.id,
          name: group.leader.name,
          displayName: group.leader.display_name,
          email: group.leader.email,
        },
        members: membersList,
        messages: group.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isAnnouncement: msg.is_announcement,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            displayName: msg.sender.display_name,
            email: msg.sender.email,
          },
          createdAt: msg.created_at,
        })),
        createdAt: group.created_at,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

