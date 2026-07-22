import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, userGroups, userEvents, groupMessages, groupMessageReactions, groupMessageReads } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  isGroupImageStorageLocal,
} from "@/lib/group-image-local-store";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

// S3クライアントの初期化
import { getR2Client } from "@/lib/r2";



/**
 * 団体に関連するS3の画像をすべて削除する
 */
async function deleteGroupImages(groupId: string): Promise<void> {
  if (isGroupImageStorageLocal()) {
    try {
      // await deleteLocalGroupImagesByGroupId(groupId);
      NextResponse.json({ success: true, message: "Temporarily mocked for Cloudflare migration" });
    } catch (error) {
      console.error(`Error deleting local images for group ${groupId}:`, error);
    }
    return;
  }

  // 環境変数が設定されていない場合はスキップ
  if (!process.env.R2_BUCKET_NAME) {
    console.warn("R2_BUCKET_NAME is not set, skipping image deletion");
    return;
  }

  // 認証情報が設定されていない場合はスキップ
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("S3 credentials are not set, skipping image deletion");
    return;
  }

  try {
    const s3Client = getR2Client();
    const prefix = `uploads/images/${groupId}/`;
    let continuationToken: string | undefined;

    do {
      // 団体ID配下のすべてのオブジェクトをリストアップ
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3Client.send(listCommand);

      // オブジェクトが存在する場合、削除を実行
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // 各オブジェクトを削除
        const deletePromises = listResponse.Contents.map((object) => {
          if (!object.Key) return Promise.resolve();

          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: object.Key,
          });
          return s3Client.send(deleteCommand);
        });

        await Promise.all(deletePromises);
      }

      // 次のページがある場合は続行
      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
  } catch (error) {
    console.error(`Error deleting images for group ${groupId}:`, error);
  }
}

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
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
      with: {
        event: {
          columns: {
            id: true,
            name: true,
            eventDate: true,
          },
        },
        user: { // leader
          columns: {
            id: true,
            name: true,
            displayName: true,
            email: true,
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
    const sessionUserId = session?.user?.id;
    if (sessionUserId) {
      userGroup = await db
        .select()
        .from(userGroups)
        .where(
          and(
            eq(userGroups.userId, sessionUserId),
            eq(userGroups.groupId, id)
          )
        )
        .get();

      // オーナー（リーダー）の場合はUserGroupに存在しなくてもアクセス可能
      isLeader = group.leaderUserId === sessionUserId;

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
    }

    // メンバー一覧を取得
    const groupMembers = await db.query.userGroups.findMany({
      where: eq(userGroups.groupId, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const leader = group.user || {
      id: group.leaderUserId,
      name: "リーダー",
      displayName: null,
      email: null,
    };

    // リーダーがUserGroupに存在しない場合、リーダーもメンバー一覧に追加
    const leaderInMembers = groupMembers.some((gm: any) => gm.userId === group.leaderUserId);
    const membersList = groupMembers
      .filter((gm: any) => gm.user !== null)
      .map((gm: any) => ({
        id: gm.user.id,
        name: gm.user.name,
        displayName: gm.user.displayName,
        email: gm.user.email,
        status: gm.status,
      }));

    if (!leaderInMembers) {
      membersList.push({
        id: leader.id,
        name: leader.name,
        displayName: leader.displayName,
        email: leader.email,
        status: "INTERESTED",
      });

      // ログインしている場合のみ、リーダーをUserGroupに追加
      if (sessionUserId) {
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
    }

    return NextResponse.json(
      {
        id: group.id,
        name: group.name,
        theme: group.theme,
        groupCode: group.groupCode,
        maxMembers: group.maxMembers,
        memberCount: membersList.length,
        isLeader: sessionUserId ? isLeader : false,
        ownerNote: group.ownerNote ?? null,
        groupDescription: group.groupDescription ?? null,
        event: group.event ? {
          id: group.event.id,
          name: group.event.name,
          event_date: new Date(group.event.eventDate).toISOString(),
        } : null,
        leader: {
          id: leader.id,
          name: leader.name,
          displayName: leader.displayName,
          email: leader.email,
        },
        members: membersList,
        createdAt: new Date(group.createdAt).toISOString(),
      },
      {
        headers: {
          "Cache-Control": sessionUserId
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

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

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

    // オーナーのみ解散可能
    if (group.leaderUserId !== userId) {
      return NextResponse.json(
        { error: "Only the group leader can disband the group" },
        { status: 403 }
      );
    }

    // トランザクションで団体と関連データを削除
    await db.transaction(async (tx: any) => {
      // 1. メッセージIDをリストアップ
      const messagesList = await tx
        .select({ id: groupMessages.id })
        .from(groupMessages)
        .where(eq(groupMessages.groupId, id));

      const msgIds = messagesList.map((m: any) => m.id);

      // 2. メッセージに関連する既読情報・リアクションを削除
      if (msgIds.length > 0) {
        await tx.delete(groupMessageReactions).where(inArray(groupMessageReactions.messageId, msgIds));
        await tx.delete(groupMessageReads).where(inArray(groupMessageReads.messageId, msgIds));
        await tx.delete(groupMessages).where(inArray(groupMessages.id, msgIds));
      } else {
        await tx.delete(groupMessages).where(eq(groupMessages.groupId, id));
      }

      // 3. UserGroupから削除
      await tx.delete(userGroups).where(eq(userGroups.groupId, id));

      // 4. UserEventからgroup_idを削除（nullに更新）
      await tx
        .update(userEvents)
        .set({
          groupId: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userEvents.groupId, id));

      // 5. 団体を削除
      await tx.delete(groups).where(eq(groups.id, id));
    });

    // S3から団体に関連する画像を削除（トランザクション外で実行）
    await deleteGroupImages(id);

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
