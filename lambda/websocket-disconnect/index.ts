import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const GROUP_ROOMS_TABLE = process.env.GROUP_ROOMS_TABLE || "";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    // 接続情報を取得
    const connectionResult = await docClient.send(
      new QueryCommand({
        TableName: CONNECTIONS_TABLE,
        KeyConditionExpression: "connectionId = :connectionId",
        ExpressionAttributeValues: {
          ":connectionId": connectionId,
        },
      })
    );

    if (connectionResult.Items && connectionResult.Items.length > 0) {
      const userId = connectionResult.Items[0].userId;

      // 参加している団体のルームから削除
      // 注意: GROUP_ROOMS_TABLEは複合キー（groupId, connectionId）のため、
      // connectionIdで直接クエリできない。Scanを使用（小規模なデータセットの場合）
      // 本番環境では、GSIを追加することを推奨
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: GROUP_ROOMS_TABLE,
          FilterExpression: "connectionId = :connectionId",
          ExpressionAttributeValues: {
            ":connectionId": connectionId,
          },
        })
      );

      if (scanResult.Items) {
        for (const room of scanResult.Items) {
          await docClient.send(
            new DeleteCommand({
              TableName: GROUP_ROOMS_TABLE,
              Key: {
                groupId: room.groupId,
                connectionId: connectionId,
              },
            })
          );
        }
      }

      // 接続情報を削除
      await docClient.send(
        new DeleteCommand({
          TableName: CONNECTIONS_TABLE,
          Key: {
            connectionId,
          },
        })
      );

      console.log(`[WebSocket] User ${userId} disconnected: ${connectionId}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Disconnected" }),
    };
  } catch (error) {
    console.error("WebSocket disconnect error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

