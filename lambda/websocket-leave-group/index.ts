import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUP_ROOMS_TABLE = process.env.GROUP_ROOMS_TABLE || "";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    const body = JSON.parse(event.body || "{}");
    const { groupId } = body;

    if (!groupId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Group ID required" }),
      };
    }

    // 団体のルームから接続情報を削除
    await docClient.send(
      new DeleteCommand({
        TableName: GROUP_ROOMS_TABLE,
        Key: {
          groupId,
          connectionId,
        },
      })
    );

    console.log(`[WebSocket] User left group:${groupId}, connection:${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Left group",
        groupId,
      }),
    };
  } catch (error) {
    console.error("WebSocket leave-group error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

