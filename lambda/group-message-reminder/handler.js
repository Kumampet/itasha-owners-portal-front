"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_ses_1 = require("@aws-sdk/client-ses");
// Prisma Clientの初期化
function createPrismaClient() {
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
    const adapter = new adapter_mariadb_1.PrismaMariaDb(poolConfig);
    return new client_1.PrismaClient({
        adapter,
        log: ["error"],
    });
}
// Prisma Clientをグローバルに保持（Lambdaのコールドスタート対策）
const globalForPrisma = globalThis;
let prismaInstance;
function getPrisma() {
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
const sesClient = new client_ses_1.SESClient({
    region: process.env.AWS_REGION || process.env.APP_AWS_REGION || "ap-northeast-1",
});
// メール送信関数
async function sendEmail({ to, subject, body, }) {
    const fromEmail = process.env.SES_FROM_EMAIL || "noreply@itasha-owners-navi.link";
    const command = new client_ses_1.SendEmailCommand({
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
    }
    catch (error) {
        console.error(`[Group Message Reminder] Failed to send email to ${to}:`, error);
        throw error;
    }
}
// Lambda関数のハンドラー
const handler = async (event) => {
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
                    // 団体の全メッセージを取得
                    const allMessages = await prisma.groupMessage.findMany({
                        where: {
                            group_id: groupId,
                        },
                        select: {
                            id: true,
                        },
                        orderBy: {
                            created_at: "desc",
                        },
                    });
                    // ユーザーが既読しているメッセージを取得
                    const readMessages = await prisma.groupMessageRead.findMany({
                        where: {
                            user_id: user.id,
                            message_id: {
                                in: allMessages.map((m) => m.id),
                            },
                        },
                        select: {
                            message_id: true,
                        },
                    });
                    const readMessageIds = new Set(readMessages.map((r) => r.message_id));
                    const unreadCount = allMessages.filter((m) => !readMessageIds.has(m.id)).length;
                    if (unreadCount > 0) {
                        unreadGroups.push({
                            id: groupId,
                            name: userGroup.group.name,
                            unreadCount,
                        });
                    }
                }
                // 未読メッセージがある場合のみメール送信
                if (unreadGroups.length > 0) {
                    const displayName = user.display_name || user.name || "ユーザー";
                    const groupList = unreadGroups
                        .map((g) => `・${g.name}（${g.unreadCount}件）`)
                        .join("\n");
                    const subject = `【${unreadGroups.length}件の団体】未読メッセージのお知らせ`;
                    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <p>${displayName} 様</p>
  <p>未読メッセージがあります。以下の団体で新しいメッセージが届いています。</p>
  <pre>${groupList}</pre>
  <p>詳細はアプリをご確認ください。</p>
</body>
</html>
          `.trim();
                    await sendEmail({
                        to: user.email,
                        subject,
                        body,
                    });
                    totalEmailsSent++;
                    results.push({
                        userId: user.id,
                        email: user.email,
                        success: true,
                        unreadGroups: unreadGroups.length,
                    });
                }
            }
            catch (error) {
                console.error(`[Group Message Reminder] Error processing user ${user.id}:`, error);
                totalEmailsFailed++;
                results.push({
                    userId: user.id,
                    email: user.email,
                    success: false,
                    unreadGroups: 0,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        const response = {
            success: true,
            usersChecked: users.length,
            emailsSent: totalEmailsSent,
            emailsFailed: totalEmailsFailed,
            results,
            timestamp: new Date().toISOString(),
        };
        console.log(`[Group Message Reminder] Completed: checked ${users.length} users, sent ${totalEmailsSent} emails, failed ${totalEmailsFailed}`);
        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        console.error("[Group Message Reminder] Error checking unread messages:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to check unread messages",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
        };
    }
    finally {
        // Prisma接続をクローズ
        try {
            await prisma.$disconnect();
        }
        catch (disconnectError) {
            console.error("[Group Message Reminder] Error disconnecting Prisma:", disconnectError);
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map