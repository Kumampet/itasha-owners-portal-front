import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUP_ROOMS_TABLE = process.env.GROUP_ROOMS_TABLE || "";
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT || "";

interface BroadcastMessageEvent {
  groupId: string;
  message?: {
    id: string;
    content: string;
    isAnnouncement: boolean;
    sender: {
      id: string;
      name: string | null;
      displayName: string | null;
      email: string;
    };
    createdAt: string;
  };
  type?: string;
  userId?: string;
  messageId?: string;
}

export const handler: Handler<BroadcastMessageEvent> = async (event) => {
  const { groupId, message, type, userId, messageId } = event;

  if (!groupId) {
    console.error("[Broadcast] Invalid event:", event);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Group ID required" }),
    };
  }

  // メッセージ送信の場合
  if (message) {
    return await broadcastMessage(groupId, message);
  }

  // 既読状態更新の場合
  if (type === "read-updated" && userId && messageId) {
    return await broadcastReadUpdate(groupId, userId, messageId);
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Invalid event type" }),
  };
};

async function broadcastMessage(groupId: string, message: BroadcastMessageEvent["message"]) {
  if (!message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Message required" }),
    };
  }

  try {
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

    if (!groupRoomsResult.Items || groupRoomsResult.Items.length === 0) {
      console.log(`[Broadcast] No active connections for group:${groupId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No active connections" }),
      };
    }

    // API Gateway Management APIクライアントの初期化
    const apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: WEBSOCKET_API_ENDPOINT,
    });

    // メッセージを全接続にブロードキャスト
    const broadcastPromises = groupRoomsResult.Items.map(async (room) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: room.connectionId,
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
          console.log(`[Broadcast] Connection ${room.connectionId} is gone`);
        } else {
          console.error(`[Broadcast] Error sending to ${room.connectionId}:`, error);
        }
      }
    });

    await Promise.all(broadcastPromises);

    console.log(`[Broadcast] Message broadcasted to group:${groupId}, connections: ${groupRoomsResult.Items.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message broadcasted",
        groupId,
        connections: groupRoomsResult.Items.length,
      }),
    };
  } catch (error) {
    console.error("[Broadcast] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

async function broadcastReadUpdate(groupId: string, userId: string, messageId: string) {
  try {
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

    if (!groupRoomsResult.Items || groupRoomsResult.Items.length === 0) {
      console.log(`[Broadcast] No active connections for group:${groupId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No active connections" }),
      };
    }

    // API Gateway Management APIクライアントの初期化
    const apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: WEBSOCKET_API_ENDPOINT,
    });

    // 既読状態更新を全接続にブロードキャスト
    const broadcastPromises = groupRoomsResult.Items.map(async (room) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: room.connectionId,
            Data: JSON.stringify({
              type: "read-updated",
              groupId,
              userId,
              messageId,
            }),
          })
        );
      } catch (error: unknown) {
        // 接続が切断されている場合は無視
        const errorObj = error as { statusCode?: number };
        if (errorObj.statusCode === 410) {
          console.log(`[Broadcast] Connection ${room.connectionId} is gone`);
        } else {
          console.error(`[Broadcast] Error sending to ${room.connectionId}:`, error);
        }
      }
    });

    await Promise.all(broadcastPromises);

    console.log(`[Broadcast] Read update broadcasted to group:${groupId}, connections: ${groupRoomsResult.Items.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Read update broadcasted",
        groupId,
        connections: groupRoomsResult.Items.length,
      }),
    };
  } catch (error) {
    console.error("[Broadcast] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

