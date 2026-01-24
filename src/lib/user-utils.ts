import { prisma } from "@/lib/prisma";

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
  const groupsLeading = await prisma.group.findMany({
    where: { leader_user_id: userId },
    select: {
      id: true,
      name: true,
    },
  });

  for (const group of groupsLeading) {
    // グループのメンバーを加入日時順（created_at昇順）で取得
    const groupMembers = await prisma.userGroup.findMany({
      where: {
        group_id: group.id,
        // 削除対象のユーザーは除外
        user_id: { not: userId },
      },
      orderBy: {
        created_at: "asc",
      },
      select: {
        user_id: true,
      },
    });

    if (groupMembers.length === 0) {
      // メンバーがいない場合はグループを削除
      try {
        await prisma.group.delete({
          where: { id: group.id },
        });
      } catch (groupDeleteError) {
        console.error("Error deleting group:", groupDeleteError);
        // グループ削除に失敗しても続行（後で手動で削除可能）
      }
      continue;
    }

    // 加入日時が一番早いメンバーを新しいリーダーに設定
    const newLeaderId = groupMembers[0].user_id;

    try {
      await prisma.group.update({
        where: { id: group.id },
        data: { leader_user_id: newLeaderId },
      });
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
      // throwOnErrorがfalseの場合は続行（論理削除時に移譲済みの可能性がある）
    }
  }

  return null;
}
