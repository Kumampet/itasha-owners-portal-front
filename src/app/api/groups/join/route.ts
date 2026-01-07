import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/join
// 既存団体への加入API
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { groupCode } = body;

    if (!groupCode) {
      return NextResponse.json(
        { error: "groupCode is required" },
        { status: 400 }
      );
    }

    // 団体コードで団体を検索（団体コードは一意なので、これだけで特定できる）
    const group = await prisma.group.findUnique({
      where: { group_code: groupCode },
      include: {
        event: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // 見つかった団体のイベントIDを使用
    const eventId = group.event_id;

    // 既に参加しているか確認
    const existingUserEvent = await prisma.userEvent.findUnique({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: eventId,
        },
      },
    });

    if (existingUserEvent && existingUserEvent.group_id) {
      return NextResponse.json(
        { error: "Already joined a group for this event" },
        { status: 400 }
      );
    }

    // 最大メンバー数チェック
    if (group.max_members) {
      const memberCount = await prisma.userEvent.count({
        where: {
          group_id: group.id,
        },
      });

      if (memberCount >= group.max_members) {
        return NextResponse.json(
          { error: "Group is full" },
          { status: 400 }
        );
      }
    }

    // UserEventを作成または更新
    await prisma.userEvent.upsert({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: eventId,
        },
      },
      update: {
        group_id: group.id,
      },
      create: {
        user_id: session.user.id,
        event_id: eventId,
        group_id: group.id,
        status: "INTERESTED",
      },
    });

    return NextResponse.json({
      groupId: group.id,
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}

