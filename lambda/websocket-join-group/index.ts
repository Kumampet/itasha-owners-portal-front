import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
  
  // 接続情報からuserIdを取得
  const connectionResult = await docClient.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      KeyConditionExpression: "connectionId = :connectionId",
      ExpressionAttributeValues: {
        ":connectionId": connectionId,
      },
    })
  );

  if (!connectionResult.Items || connectionResult.Items.length === 0) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Connection not found" }),
    };
  }

  const userId = connectionResult.Items[0].userId;

  try {
    const body = JSON.parse(event.body || "{}");
    const { groupId } = body;

    if (!groupId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Group ID required" }),
      };
    }

    // ユーザーがこの団体のメンバーか確認
    const userEvent = await prisma.userEvent.findFirst({
      where: {
        user_id: userId,
        group_id: groupId,
      },
    });

    if (!userEvent) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Not a member of this group" }),
      };
    }

    // 団体のルームに接続情報を追加
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1時間後
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

    console.log(`[WebSocket] User ${userId} joined group:${groupId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Joined group",
        groupId,
      }),
    };
  } catch (error) {
    console.error("WebSocket join-group error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

