import { APIGatewayProxyWebsocketHandlerV2, APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { PrismaClient } from "@prisma/client";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Prisma Clientの初期化
// DATABASE_URL環境変数から自動的に読み込まれる
const prisma = new PrismaClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const GROUP_ROOMS_TABLE = process.env.GROUP_ROOMS_TABLE || "";

// API Gateway Management APIクライアントの初期化
const getApiGatewayClient = (event: APIGatewayProxyWebsocketEventV2) => {
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  return new ApiGatewayManagementApiClient({
    endpoint,
  });
};

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
    const { groupId, message } = body;

    if (!groupId || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Group ID and message required" }),
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

    // 団体のルームに参加している全接続を取得
    const groupRoomsResult = await docClient.send(
      new QueryCommand({
        TableName: GROUP_ROOMS_TABLE,
        KeyConditionExpression: "groupId = :groupId",
        ExpressionAttributeValues: {
          ":groupId": groupId,
        },
      })
    );

    if (!groupRoomsResult.Items) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No active connections" }),
      };
    }

    // メッセージを全接続にブロードキャスト
    const apiGatewayClient = getApiGatewayClient(event);
    const broadcastPromises = groupRoomsResult.Items.map(async (room: Record<string, unknown>) => {
      try {
        const connectionId = room.connectionId as string;
        if (!connectionId) {
          return;
        }
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify({
              type: "new-message",
              groupId,
              message,
            }),
          })
        );
      } catch (error: unknown) {
        // 接続が切断されている場合は無視
        const errorObj = error as { statusCode?: number };
        if (errorObj.statusCode === 410) {
          console.log(`[WebSocket] Connection ${connectionId} is gone, removing from room`);
          // 切断された接続をルームから削除（オプション）
        } else {
          console.error(`[WebSocket] Error sending to ${connectionId}:`, error);
        }
      }
    });

    await Promise.all(broadcastPromises);

    console.log(`[WebSocket] Message broadcasted to group:${groupId} by user:${userId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message sent",
        groupId,
      }),
    };
  } catch (error) {
    console.error("WebSocket send-message error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

