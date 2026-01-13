import { APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PrismaClient } from "@prisma/client";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Prisma Clientの初期化
// DATABASE_URL環境変数から自動的に読み込まれる
const prisma = new PrismaClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const GROUP_ROOMS_TABLE = process.env.GROUP_ROOMS_TABLE || "";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  // WebSocket接続時のクエリパラメータからuserIdを取得
  // クライアント側で wss://endpoint?userId=xxx のように接続する
  // WebSocket API Gatewayでは、クエリパラメータはeventに直接含まれる
  const eventWithQuery = event as APIGatewayProxyWebsocketEventV2 & {
    queryStringParameters?: { [key: string]: string | undefined };
  };
  const queryParams = eventWithQuery.queryStringParameters || {};
  const userId = queryParams.userId;

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "User ID required" }),
    };
  }

  try {
    // ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, is_banned: true },
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    if (user.is_banned) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "User is banned" }),
      };
    }

    // 接続情報をDynamoDBに保存
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1時間後
    await docClient.send(
      new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: {
          connectionId,
          userId,
          connectedAt: new Date().toISOString(),
          ttl,
        },
      })
    );

    // ユーザーが参加している団体を取得
    const userEvents = await prisma.userEvent.findMany({
      where: {
        user_id: userId,
        group_id: {
          not: null,
        },
      },
      include: {
        group: {
          select: {
            id: true,
          },
        },
      },
    });

    const groupIds = userEvents
      .filter((ue) => ue.group)
      .map((ue) => ue.group!.id);

    // 各団体のルームに接続情報を保存
    for (const groupId of groupIds) {
      await docClient.send(
        new PutCommand({
          TableName: GROUP_ROOMS_TABLE,
          Item: {
            groupId,
            connectionId,
            userId,
            joinedAt: new Date().toISOString(),
            ttl,
          },
        })
      );
    }

    console.log(`[WebSocket] User ${userId} connected: ${connectionId}, Groups: ${groupIds.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connected",
        groupIds,
      }),
    };
  } catch (error) {
    console.error("WebSocket connect error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

