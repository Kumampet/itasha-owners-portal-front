import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/messages/read-all
// 団体のすべてのメッセージを既読にする
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // 団体のすべてのメッセージを取得
    const messages = await prisma.groupMessage.findMany({
      where: { group_id: id },
      select: { id: true },
    });

    // すべてのメッセージを既読にする
    const now = new Date();
    await Promise.all(
      messages.map((message) =>
        prisma.groupMessageRead.upsert({
          where: {
            message_id_user_id: {
              message_id: message.id,
              user_id: session.user.id,
            },
          },
          create: {
            message_id: message.id,
            user_id: session.user.id,
            read_at: now,
          },
          update: {
            read_at: now,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: messages.length });
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all messages as read" },
      { status: 500 }
    );
  }
}

