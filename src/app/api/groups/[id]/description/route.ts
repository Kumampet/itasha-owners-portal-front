import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sanitizeHtmlServer } from "@/lib/server-html-sanitizer";

// GET /api/groups/[id]/description
// 団体説明を取得
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

    // リーダーの場合はUserGroupにいなくてもアクセス可能
    const isLeader = group.leaderUserId === userId;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        groupDescription: group.groupDescription ?? null,
        isLeader: isLeader,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching group description:", error);
    return NextResponse.json(
      { error: "Failed to fetch group description" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id]/description
// 団体説明を更新（オーナーのみ）
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
    const { groupDescription } = body;

    // groupDescriptionは任意
    if (groupDescription !== null && groupDescription !== undefined && typeof groupDescription !== "string") {
      return NextResponse.json(
        { error: "groupDescription must be a string or null" },
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
        { error: "Only the group leader can update the group description" },
        { status: 403 }
      );
    }

    // 更新（空文字列の場合はnullに変換）
    let descriptionValue = groupDescription === "" ? null : groupDescription;
    
    // HTMLをサニタイズ
    if (descriptionValue && typeof descriptionValue === "string") {
      try {
        descriptionValue = descriptionValue
          .replace(/<!DOCTYPE[^>]*>/gi, "")
          .replace(/<html[^>]*>/gi, "")
          .replace(/<\/html>/gi, "")
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
          .replace(/<body[^>]*>/gi, "")
          .replace(/<\/body>/gi, "")
          .trim();
        
        descriptionValue = sanitizeHtmlServer(descriptionValue);
        if (descriptionValue.trim() === "") {
          descriptionValue = null;
        }
      } catch (sanitizeError) {
        console.error("Error sanitizing HTML:", sanitizeError);
        descriptionValue = null;
      }
    }

    await db
      .update(groups)
      .set({
        groupDescription: descriptionValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(groups.id, id));

    return NextResponse.json(
      {
        groupDescription: descriptionValue,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error updating group description:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to update group description",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
