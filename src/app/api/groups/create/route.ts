import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** セッションと DB のユーザーがずれたとき等（再ログインで解消するケース） */
const GROUP_CREATE_RELOGIN_MESSAGE =
  "ログイン状態とサーバー側の情報が一致していない可能性があります。お手数ですが一度ログアウトしてから、再度ログインしたうえで団体作成をやり直してください。";

/** 原因が特定できない失敗でも、ユーザーにログインやり直しを促す（「時間をおいて」では案内しない） */
const GROUP_CREATE_FAILURE_RELOGIN_MESSAGE =
  "団体の作成に失敗しました。お手数ですが一度ログアウトしてから再度ログインし、団体作成をやり直してください。";

// POST /api/groups/create
// 新規団体作成API
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existingUser) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, name, theme, maxMembers } = body;

    if (!eventId || !name) {
      return NextResponse.json(
        { error: "eventId and name are required" },
        { status: 400 }
      );
    }

    // 8桁の数字の乱数で団体コードを生成
    const generateGroupCode = (): string => {
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    // ユニークな団体コードを生成（重複チェック）
    let groupCode: string = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const candidateCode = generateGroupCode();
      const existing = await prisma.group.findUnique({
        where: { group_code: candidateCode },
      });
      if (!existing) {
        groupCode = candidateCode;
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !groupCode) {
      return NextResponse.json(
        { error: "Failed to generate unique group code" },
        { status: 500 }
      );
    }

    // トランザクションで団体とUserEvent、UserGroupを作成
    const result = await prisma.$transaction(async (tx) => {
      // 団体を作成
      const group = await tx.group.create({
        data: {
          event_id: eventId,
          name,
          theme: theme || null,
          max_members: maxMembers || null,
          group_code: groupCode!,
          leader_user_id: userId,
        },
      });

      // UserGroupを作成（複数団体参加対応）
      await tx.userGroup.create({
        data: {
          user_id: userId,
          group_id: group.id,
          event_id: eventId,
          status: "INTERESTED",
        },
      });

      // UserEventも作成または更新（後方互換性のため）
      await tx.userEvent.upsert({
        where: {
          user_id_event_id: {
            user_id: userId,
            event_id: eventId,
          },
        },
        update: {
          group_id: group.id,
        },
        create: {
          user_id: userId,
          event_id: eventId,
          group_id: group.id,
          status: "INTERESTED",
        },
      });

      return group;
    });

    return NextResponse.json({
      groupId: result.id,
      groupCode: result.group_code,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 409 });
    }
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: GROUP_CREATE_FAILURE_RELOGIN_MESSAGE },
      { status: 500 },
    );
  }
}

