import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/messages/[messageId]/read
// メッセージを既読にする
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, messageId } = await params;

    // 団体を取得して、ユーザーがメンバーか確認
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            user_id: session.user.id,
          },
        },
      },
    });

    if (!group || group.members.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // メッセージが存在するか確認
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.group_id !== id) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // 既読状態を更新（既に既読の場合は更新しない）
    await prisma.groupMessageRead.upsert({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: session.user.id,
        },
      },
      create: {
        message_id: messageId,
        user_id: session.user.id,
      },
      update: {
        read_at: new Date(),
      },
    });

    // WebSocketで既読状態の更新をブロードキャスト（Lambda関数を非同期で呼び出し）
    try {
      const broadcastLambdaArn = process.env.BROADCAST_MESSAGE_LAMBDA_ARN;
      if (broadcastLambdaArn) {
        const { LambdaClient, InvokeCommand } = await import("@aws-sdk/client-lambda");
        const lambdaClient = new LambdaClient({});
        
        lambdaClient.send(
          new InvokeCommand({
            FunctionName: broadcastLambdaArn,
            InvocationType: "Event", // 非同期実行
            Payload: JSON.stringify({
              groupId: id,
              type: "read-updated",
              userId: session.user.id,
              messageId,
            }),
          })
        ).catch((error) => {
          console.error("[Read Status] Error invoking broadcast Lambda:", error);
        });
      }
    } catch (wsError) {
      console.error("[Read Status] Error broadcasting via WebSocket:", wsError);
      // WebSocketエラーはログに記録するだけで、既読更新は成功とする
    }

    return NextResponse.json({ success: true });
      } catch (error: unknown) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}

