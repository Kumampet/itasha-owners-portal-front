import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]
// 団体詳細を取得（ログインなしでもアクセス可能）
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
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
        _count: {
          select: {
            user_groups: true,
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

    // ログインしている場合のみ、メンバーシップチェックとisLeaderを設定
    let isLeader = false;
    let userGroup = null;
    if (session && session.user) {
      // ユーザーがこの団体に参加しているか確認（複数団体参加対応：UserGroupテーブルを使用）
      userGroup = await prisma.userGroup.findUnique({
        where: {
          user_id_group_id: {
            user_id: session.user.id,
            group_id: id,
          },
        },
      });

      // オーナー（リーダー）の場合はUserGroupに存在しなくてもアクセス可能
      isLeader = group.leader_user_id === session.user.id;

      // オーナーがUserGroupに存在しない場合、UserGroupに追加（データ整合性のため）
      if (isLeader && !userGroup) {
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

      // ログインしている場合のみ、リーダーをUserGroupに追加（データ整合性のため）
      if (session && session.user) {
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
    }

    // ログインしていない場合は公開情報のみ返す
    // ログインしている場合は認証情報も含める
    return NextResponse.json(
      {
        id: group.id,
        name: group.name,
        theme: group.theme,
        groupCode: group.group_code,
        maxMembers: group.max_members,
        memberCount: membersList.length,
        isLeader: session && session.user ? isLeader : false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ownerNote: (group as any).owner_note ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupDescription: (group as any).group_description ?? null,
        event: group.event,
        leader: {
          id: group.leader.id,
          name: group.leader.name,
          displayName: group.leader.display_name,
          email: group.leader.email,
        },
        members: membersList,
        createdAt: group.created_at,
      },
      {
        headers: {
          // ログインしていない場合でもキャッシュ可能（公開情報のため）
          "Cache-Control": session && session.user 
            ? "private, s-maxage=5, stale-while-revalidate=10"
            : "public, s-maxage=60, stale-while-revalidate=120",
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

// DELETE /api/groups/[id]
// 団体解散（オーナーのみ）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 団体を取得
    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // オーナーのみ解散可能
    if (group.leader_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group leader can disband the group" },
        { status: 403 }
      );
    }

    // トランザクションで団体と関連データを削除
    await prisma.$transaction(async (tx) => {
      // メッセージを削除
      await tx.groupMessage.deleteMany({
        where: { group_id: id },
      });

      // UserGroupから削除（複数団体参加対応）
      await tx.userGroup.deleteMany({
        where: { group_id: id },
      });

      // UserEventからgroup_idを削除（nullに更新、後方互換性のため）
      await tx.userEvent.updateMany({
        where: { group_id: id },
        data: { group_id: null },
      });

      // 団体を削除
      await tx.group.delete({
        where: { id },
      });
    });

    // 書き込み操作で即座に反映が必要なのでキャッシュを無効にする
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error disbanding group:", error);
    return NextResponse.json(
      { error: "Failed to disband group" },
      { status: 500 }
    );
  }
}

