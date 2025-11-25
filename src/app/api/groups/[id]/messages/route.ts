import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";

// GET /api/groups/[id]/messages
// 団体メッセージ一覧を取得
export async function GET(
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

    // メッセージを取得（新しい順）
    const messages = await prisma.groupMessage.findMany({
      where: {
        group_id: id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            display_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json(
      messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        isAnnouncement: msg.is_announcement,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          displayName: msg.sender.display_name,
          email: msg.sender.email,
        },
        createdAt: msg.created_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/messages
// 団体メッセージを送信
export async function POST(
  request: Request,
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
    const body = await request.json();
    const { content, isAnnouncement } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // 団体を取得して、ユーザーがメンバーか確認
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // ユーザーがメンバーか確認
    const isMember = group.members.some((m) => m.user_id === session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // メッセージを作成
    const message = await prisma.groupMessage.create({
      data: {
        group_id: id,
        sender_id: session.user.id,
        content: content.trim(),
        is_announcement: isAnnouncement === true,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    // 一斉連絡の場合、メール通知を送信
    if (isAnnouncement === true) {
      try {
        const senderName = session.user.name || session.user.email;
        const subject = `【${group.name}】一斉連絡: ${group.event.name}`;
        const emailBody = `
${senderName}さんからの一斉連絡です。

${content.trim()}

---
団体: ${group.name}
イベント: ${group.event.name}
`;

        // 送信者以外の全メンバーにメール送信
        const recipients = group.members
          .filter((m) => m.user_id !== session.user.id)
          .map((m) => m.user.email);

        // メール送信（エラーが発生してもメッセージ作成は成功とする）
        for (const recipient of recipients) {
          try {
            await sendEmail({
              to: recipient,
              subject,
              body: emailBody,
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${recipient}:`, emailError);
            // 個別のメール送信エラーはログに記録するだけで続行
          }
        }
      } catch (emailError) {
        console.error("Failed to send announcement emails:", emailError);
        // メール送信エラーはログに記録するだけで、メッセージ作成は成功とする
      }
    }

    return NextResponse.json({
      id: message.id,
      content: message.content,
      isAnnouncement: message.is_announcement,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
      },
      createdAt: message.created_at,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

