import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Prisma Clientの初期化
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // mysql:// 接続文字列をパース
  const normalizedUrl = databaseUrl.replace(/^mysql:\/\//, "http://");
  const dbUrl = new URL(normalizedUrl);
  const password = decodeURIComponent(dbUrl.password || "");
  const connectionLimit = parseInt(process.env.DATABASE_POOL_SIZE || "5", 10);

  const poolConfig = {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "3306"),
    user: dbUrl.username,
    password: password,
    database: dbUrl.pathname.slice(1),
    connectionLimit,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    idleTimeout: 30000,
    queueLimit: 0,
    reuseConnection: true,
    maxLifetime: 3600000,
  };

  const adapter = new PrismaMariaDb(poolConfig);
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

// Prisma Clientをグローバルに保持（Lambdaのコールドスタート対策）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }
  prismaInstance = createPrismaClient();
  globalForPrisma.prisma = prismaInstance;
  return prismaInstance;
}

// SESクライアントの初期化
const sesClient = new SESClient({
  region: process.env.AWS_REGION || process.env.APP_AWS_REGION || "ap-northeast-1",
});

// メール送信関数
async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const fromEmail = process.env.SES_FROM_EMAIL || "noreply@itasha-owners-navi.link";

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: body,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`[Group Message Reminder] Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`[Group Message Reminder] Failed to send email to ${to}:`, error);
    throw error;
  }
}

// Lambda関数のハンドラー
export const handler = async (event: any) => {
  console.log("[Group Message Reminder] Starting reminder check...");
  console.log("[Group Message Reminder] Event:", JSON.stringify(event, null, 2));

  const prisma = getPrisma();

  try {
    // 全ユーザーを取得（削除されていないユーザーのみ）
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
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

        const unreadGroups = [];
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
              to: user.email,
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
      timestamp: new Date().toISOString(),
    };

    console.log(`[Group Message Reminder] Completed: checked ${users.length} users, sent ${totalEmailsSent} emails, failed ${totalEmailsFailed}`);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("[Group Message Reminder] Error checking unread messages:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to check unread messages",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  } finally {
    // Prisma接続をクローズ
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("[Group Message Reminder] Error disconnecting Prisma:", disconnectError);
    }
  }
};
