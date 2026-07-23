import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userEvents, groupMessages, groupMessageReads } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";

// GET /api/groups/unread-count
// ユーザーが参加している団体の未読メッセージ数を取得
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ユーザーが参加している団体を取得
    const joinedGroups = await db
      .select({
        groupId: userEvents.groupId,
      })
      .from(userEvents)
      .where(
        and(
          eq(userEvents.userId, userId),
          isNotNull(userEvents.groupId)
        )
      );

    const groupIds = joinedGroups
      .map((ug: any) => ug.groupId)
      .filter(Boolean);

    if (groupIds.length === 0) {
      return NextResponse.json({});
    }

    // 各団体の未読メッセージ数を取得
    const unreadCounts: Record<string, boolean> = {};

    for (const groupId of groupIds) {
      // 団体の最新メッセージを取得
      const latestMessage = await db
        .select({ id: groupMessages.id })
        .from(groupMessages)
        .where(eq(groupMessages.groupId, groupId))
        .orderBy(desc(groupMessages.createdAt))
        .limit(1)
        .get();

      if (!latestMessage) {
        continue;
      }

      // ユーザーが最新メッセージを既読か確認
      const readRecord = await db
        .select()
        .from(groupMessageReads)
        .where(
          and(
            eq(groupMessageReads.messageId, latestMessage.id),
            eq(groupMessageReads.userId, userId)
          )
        )
        .get();

      // 未読の場合はtrue、既読の場合はfalse
      unreadCounts[groupId] = !readRecord;
    }

    // リアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      unreadCounts,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch unread counts",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
