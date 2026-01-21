import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/owner-note
// 団体オーナーからのお知らせを取得
export async function GET(
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

    // ユーザーがこの団体に参加しているか確認（複数団体参加対応：UserGroupテーブルを使用）
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        user_id_group_id: {
          user_id: session.user.id,
          group_id: id,
        },
      },
    });

    // オーナー（リーダー）の場合はUserGroupに存在しなくてもアクセス可能
    const isLeader = group.leader_user_id === session.user.id;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ownerNote: (group as any).owner_note ?? null,
        isLeader: group.leader_user_id === session.user.id,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching owner note:", error);
    return NextResponse.json(
      { error: "Failed to fetch owner note" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id]/owner-note
// 団体オーナーからのお知らせを更新（オーナーのみ）
export async function PATCH(
  request: Request,
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
    const body = await request.json();
    const { ownerNote } = body;

    // ownerNoteは任意（nullまたは文字列）
    if (ownerNote !== null && ownerNote !== undefined && typeof ownerNote !== "string") {
      return NextResponse.json(
        { error: "ownerNote must be a string or null" },
        { status: 400 }
      );
    }

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

    // オーナーのみ更新可能
    if (group.leader_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group leader can update the owner note" },
        { status: 403 }
      );
    }

    // 更新（空文字列の場合はnullに変換）
    const noteValue = ownerNote === "" ? null : ownerNote;

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        owner_note: noteValue,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return NextResponse.json(
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ownerNote: (updatedGroup as any).owner_note ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error updating owner note:", error);
    return NextResponse.json(
      { error: "Failed to update owner note" },
      { status: 500 }
    );
  }
}
