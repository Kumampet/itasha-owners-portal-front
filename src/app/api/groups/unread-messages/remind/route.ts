import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";

// GET /api/groups/unread-messages/remind
// 未読メッセージがあるユーザーにリマインドメールを送信
// このエンドポイントは定期的に呼び出される（cronジョブなど）
export async function GET(request: Request) {
  try {
    // 認証チェック（オプション: 環境変数でAPIキーを設定）
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.GROUP_MESSAGE_REMINDER_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Group Message Reminder] Starting reminder check...");

    // 全ユーザーを取得（メールアドレスがあるユーザーのみ）
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: null,
        },
        deleted_at: null, // 削除されていないユーザーのみ
      },
      select: {
        id: true,
        email: true,
        name: true,
        display_name: true,
      },
    });

    console.log(`[Group Message Reminder] Found ${users.length} users to check`);

    const results = [];
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    for (const user of users) {
      try {
        // ユーザーが参加している団体を取得（UserGroupテーブルを使用）
        const userGroups = await prisma.userGroup.findMany({
          where: {
            user_id: user.id,
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (userGroups.length === 0) {
          continue;
        }

        const groupIds = userGroups.map((ug) => ug.group.id);
        const unreadGroups: Array<{ groupId: string; groupName: string }> = [];

        // 各団体の未読メッセージをチェック
        for (const userGroup of userGroups) {
          const groupId = userGroup.group.id;

          // 団体の最新メッセージを取得
          const latestMessage = await prisma.groupMessage.findFirst({
            where: { group_id: groupId },
            orderBy: { created_at: "desc" },
            select: { id: true, created_at: true },
          });

          if (!latestMessage) {
            continue;
          }

          // ユーザーが最新メッセージを既読か確認
          const readRecord = await prisma.groupMessageRead.findUnique({
            where: {
              message_id_user_id: {
                message_id: latestMessage.id,
                user_id: user.id,
              },
            },
          });

          // 未読の場合はリストに追加
          if (!readRecord) {
            unreadGroups.push({
              groupId: groupId,
              groupName: userGroup.group.name,
            });
          }
        }

        // 未読メッセージがある団体があればメールを送信
        if (unreadGroups.length > 0) {
          // 最初の未読団体の情報を使用（複数ある場合は最初の1つ）
          const firstUnreadGroup = unreadGroups[0];
          
          const displayName = user.display_name || user.name || "ユーザー";
          const groupName = firstUnreadGroup.groupName;

          const subject = `【いたなび！】${groupName} | 未読メッセージのお知らせ`;
          const body = `${displayName}さん

いつもいたなび！をご利用いただきありがとうございます。

--------------------------

${groupName}に未読メッセージがあります！
チェックしてみませんか？

マイページはこちら
https://itasha-owners-navi.link/app/mypage

--------------------------

引き続きいたなび！をよろしくお願いします。

※このメールは送信専用です。返信されても回答できません。
※その他お問い合わせは以下の専用フォームからお願いします。
https://itasha-owners-navi.link/app/contact
`;

          try {
            await sendEmail({
              to: user.email!,
              subject: subject,
              body: body,
            });

            totalEmailsSent++;
            results.push({
              userId: user.id,
              email: user.email,
              groupName: groupName,
              success: true,
            });

            console.log(`[Group Message Reminder] ✅ Sent email to ${user.email} for group ${groupName}`);
          } catch (emailError) {
            totalEmailsFailed++;
            results.push({
              userId: user.id,
              email: user.email,
              groupName: groupName,
              success: false,
              error: emailError instanceof Error ? emailError.message : "Unknown error",
            });

            console.error(`[Group Message Reminder] ❌ Failed to send email to ${user.email}:`, emailError);
          }
        }
      } catch (error) {
        console.error(`[Group Message Reminder] Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response = {
      checked: users.length,
      emailsSent: totalEmailsSent,
      emailsFailed: totalEmailsFailed,
      results: results.slice(0, 100), // 最初の100件のみ返す（ログが長くなりすぎないように）
      timestamp: new Date().toISOString(),
    };

    console.log(`[Group Message Reminder] Completed: checked ${users.length} users, sent ${totalEmailsSent} emails, failed ${totalEmailsFailed}`);

    // 処理系のエンドポイントでリアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      response,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Group Message Reminder] Error checking unread messages:", error);
    return NextResponse.json(
      { 
        error: "Failed to check unread messages", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
