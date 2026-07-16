import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/groups/[id]/owner-note
// 団体オーナーからのお知らせを取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // 団体を取得
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // ユーザーがこの団体に参加しているか確認
    const userGroup = await db
      .select()
      .from(userGroups)
      .where(
        and(
          eq(userGroups.userId, userId),
          eq(userGroups.groupId, id)
        )
      )
      .get();

    // オーナー（リーダー）の場合はUserGroupに存在しなくてもアクセス可能
    const isLeader = group.leaderUserId === userId;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // オーナーがUserGroupに存在しない場合、UserGroupに追加（データ整合性のため）
    if (isLeader && !userGroup) {
      try {
        await db.insert(userGroups).values({
          userId: group.leaderUserId,
          groupId: id,
          eventId: group.eventId,
          status: "INTERESTED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // 既に存在する場合は無視
      }
    }

    return NextResponse.json(
      {
        ownerNote: group.ownerNote ?? null,
        isLeader: isLeader,
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

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();
    const { ownerNote } = body;

    // ownerNoteは任意
    if (ownerNote !== null && ownerNote !== undefined && typeof ownerNote !== "string") {
      return NextResponse.json(
        { error: "ownerNote must be a string or null" },
        { status: 400 }
      );
    }

    // 団体を取得
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // オーナーのみ更新可能
    if (group.leaderUserId !== userId) {
      return NextResponse.json(
        { error: "Only the group leader can update the owner note" },
        { status: 403 }
      );
    }

    // 更新（空文字列の場合はnullに変換）
    const noteValue = ownerNote === "" ? null : ownerNote;

    await db
      .update(groups)
      .set({
        ownerNote: noteValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(groups.id, id));

    return NextResponse.json(
      {
        ownerNote: noteValue,
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
