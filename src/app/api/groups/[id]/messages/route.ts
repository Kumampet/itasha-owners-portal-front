import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, groupMessages } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { sendPushNotificationToUsers } from "@/lib/push-notification";

// GET /api/groups/[id]/messages
// 団体メッセージ一覧を取得
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

    // メッセージを取得（古い順）
    const messages = await db.query.groupMessages.findMany({
      where: eq(groupMessages.groupId, id),
      orderBy: asc(groupMessages.createdAt),
      with: {
        user: { // sender
          columns: {
            id: true,
            name: true,
            displayName: true,
            email: true,
          },
        },
        groupMessageReactions: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // レスポンスマッピング
    const formattedMessages = messages.map((msg: any) => {
      const reactionMap = new Map<string, Array<{ userId: string; userName: string | null; displayName: string | null }>>();
      
      const reactionsRaw = msg.groupMessageReactions || [];
      reactionsRaw.forEach((reaction: any) => {
        const emoji = reaction.emoji;
        if (!reactionMap.has(emoji)) {
          reactionMap.set(emoji, []);
        }
        reactionMap.get(emoji)!.push({
          userId: reaction.user.id,
          userName: reaction.user.name,
          displayName: reaction.user.displayName,
        });
      });

      const reactions = Array.from(reactionMap.entries()).map(([emoji, users]) => ({
        emoji,
        count: users.length,
        users: users.map((u) => ({
          id: u.userId,
          name: u.userName,
          displayName: u.displayName,
        })),
      }));

      const sender = msg.user || {
        id: "",
        name: "退会したユーザー",
        displayName: null,
        email: null,
      };

      return {
        id: msg.id,
        content: msg.content,
        isAnnouncement: msg.isAnnouncement,
        sender: {
          id: sender.id,
          name: sender.name,
          displayName: sender.displayName,
          email: sender.email,
        },
        createdAt: new Date(msg.createdAt).toISOString(),
        reactions,
      };
    });

    // リアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      formattedMessages,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/messages
// 団体メッセージを送信
export async function POST(
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
    const { content, isAnnouncement } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
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

    const isLeader = group.leaderUserId === userId;
    if (!userGroup && !isLeader) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // オーナーがUserGroupに存在しない場合、UserGroupに追加
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

    // メンバー一覧を取得（プッシュ通知送信用）
    const groupMembers = await db
      .select({ userId: userGroups.userId })
      .from(userGroups)
      .where(eq(userGroups.groupId, id));

    const messageId = crypto.randomUUID();
    const createdAtStr = new Date().toISOString();

    // メッセージを作成
    await db.insert(groupMessages).values({
      id: messageId,
      groupId: id,
      senderId: userId,
      content: content.trim(),
      isAnnouncement: isAnnouncement === true,
      createdAt: createdAtStr,
    });

    // プッシュ通知を送信（送信者以外の全メンバーに）
    try {
      const recipientUserIds = groupMembers
        .filter((gm: any) => gm.userId !== userId)
        .map((gm: any) => gm.userId);

      if (recipientUserIds.length > 0) {
        const senderName = session.user.name || session.user.email || "メンバー";
        const title = isAnnouncement
          ? `【${group.name}】一斉連絡`
          : `${group.name}からのメッセージ`;
        const bodyText = `${senderName}: ${content.trim().substring(0, 100)}${content.trim().length > 100 ? "..." : ""}`;

        sendPushNotificationToUsers(recipientUserIds, title, bodyText, {
          type: "group_message",
          groupId: id,
          messageId: messageId,
          url: `/app/groups/${id}`,
        }).catch((error) => {
          console.error("[Group Message] Failed to send push notifications:", error);
        });
      }
    } catch (pushError) {
      console.error("[Group Message] Error sending push notifications:", pushError);
    }

    return NextResponse.json({
      id: messageId,
      content: content.trim(),
      isAnnouncement: isAnnouncement === true,
      sender: {
        id: userId,
        name: session.user.name || null,
        displayName: session.user.displayName || null,
        email: session.user.email || null,
      },
      createdAt: createdAtStr,
      reactions: [],
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
