import { db } from "@/lib/db";
import { groups, userGroups } from "@/db/schema";
import { eq, and, ne, asc } from "drizzle-orm";

/**
 * ユーザーがリーダーになっているグループのリーダー権限を移譲する
 * メンバーがいない場合はグループを削除する
 * 
 * @param userId 削除対象のユーザーID
 * @param options エラーハンドリングのオプション
 * @returns エラーが発生した場合、エラー情報を返す。成功時はnull
 */
export async function transferGroupLeadership(
  userId: string,
  options: {
    /**
     * エラー時に例外を投げるかどうか
     * trueの場合、エラー時に例外を投げる（論理削除時など）
     * falseの場合、エラーをログに記録して続行（物理削除時など）
     */
    throwOnError?: boolean;
  } = {}
): Promise<{ groupId: string; groupName: string; message: string } | null> {
  const { throwOnError = false } = options;

  // リーダーになっているグループを検索
  const groupsLeading = await db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups)
    .where(eq(groups.leaderUserId, userId));

  for (const group of groupsLeading) {
    // グループのメンバーを加入日時順（created_at昇順）で取得
    const groupMembers = await db
      .select({
        userId: userGroups.userId,
      })
      .from(userGroups)
      .where(
        and(
          eq(userGroups.groupId, group.id),
          ne(userGroups.userId, userId)
        )
      )
      .orderBy(asc(userGroups.createdAt));

    if (groupMembers.length === 0) {
      // メンバーがいない場合はグループを削除
      try {
        await db.delete(groups).where(eq(groups.id, group.id));
      } catch (groupDeleteError) {
        console.error("Error deleting group:", groupDeleteError);
      }
      continue;
    }

    // 加入日時が一番早いメンバーを新しいリーダーに設定
    const newLeaderId = groupMembers[0].userId;

    try {
      await db
        .update(groups)
        .set({
          leaderUserId: newLeaderId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(groups.id, group.id));
    } catch (leaderUpdateError) {
      const errorMessage = leaderUpdateError instanceof Error
        ? leaderUpdateError.message
        : String(leaderUpdateError);

      console.error("Error transferring leadership:", leaderUpdateError);

      if (throwOnError) {
        return {
          groupId: group.id,
          groupName: group.name,
          message: errorMessage,
        };
      }
    }
  }

  return null;
}
