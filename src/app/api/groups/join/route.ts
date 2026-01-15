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
    const { groupCode, force } = body;

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

    // 既にこの特定の団体に参加しているか確認（重複加入チェック）
    const existingUserGroup = await prisma.userGroup.findUnique({
      where: {
        user_id_group_id: {
          user_id: session.user.id,
          group_id: group.id,
        },
      },
    });

    // 同一ユーザーがすでに加入している団体への重複加入は認めない
    if (existingUserGroup) {
      return NextResponse.json(
        { error: "Already joined this group" },
        { status: 400 }
      );
    }

    // 同一イベントで既に別の団体に参加しているか確認（警告用）
    const otherUserGroupsInSameEvent = await prisma.userGroup.findMany({
      where: {
        user_id: session.user.id,
        event_id: eventId,
        group_id: {
          not: group.id,
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            group_code: true,
          },
        },
      },
    });

    // 警告メッセージ用の情報
    let warningMessage: string | null = null;
    if (otherUserGroupsInSameEvent.length > 0) {
      const groupNames = otherUserGroupsInSameEvent.map((ug: { group: { name: string } }) => ug.group.name).join("、");
      const eventName = group.event.name;
      warningMessage = `既に同一イベント（${eventName}）の他の団体（${groupNames}）に参加しています。`;

      // 警告がある場合、forceパラメータがない限り、加入処理を中断して警告を返す
      if (!force) {
        return NextResponse.json({
          warning: warningMessage,
          requiresConfirmation: true,
          groupId: group.id,
        });
      }
    }

    // 最大メンバー数チェック（UserGroupテーブルを使用）
    if (group.max_members) {
      const memberCount = await prisma.userGroup.count({
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

    // UserGroupを作成（複数団体参加対応）
    await prisma.userGroup.create({
      data: {
        user_id: session.user.id,
        group_id: group.id,
        event_id: eventId,
        status: "INTERESTED",
      },
    });

    // UserEventも作成または更新（後方互換性のため）
    await prisma.userEvent.upsert({
      where: {
        user_id_event_id: {
          user_id: session.user.id,
          event_id: eventId,
        },
      },
      update: {
        // UserEvent.group_idは後方互換性のため残すが、最新の参加団体を設定
        // 複数団体参加の場合は最初に参加した団体を設定（既存の動作を維持）
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
      warning: warningMessage,
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}

