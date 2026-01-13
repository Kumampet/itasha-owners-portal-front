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
        members: {
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
            members: true,
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

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      {
        id: group.id,
        name: group.name,
        theme: group.theme,
        groupCode: group.group_code,
        maxMembers: group.max_members,
        memberCount: group._count.members,
        messageCount: group._count.messages,
        event: group.event,
        leader: {
          id: group.leader.id,
          name: group.leader.name,
          displayName: group.leader.display_name,
          email: group.leader.email,
        },
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          displayName: m.user.display_name,
          email: m.user.email,
          status: m.status,
        })),
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

