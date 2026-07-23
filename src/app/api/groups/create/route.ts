import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, groups, userGroups, userEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROUP_CREATE_RELOGIN_MESSAGE =
  "ログイン状態とサーバー側の情報が一致していない可能性があります。お手数ですが一度ログアウトしてから、再度ログインしたうえで団体作成をやり直してください。";

const GROUP_CREATE_FAILURE_RELOGIN_MESSAGE =
  "団体の作成に失敗しました。お手数ですが一度ログアウトしてから再度ログインし、団体作成をやり直してください。";

// POST /api/groups/create
// 新規団体作成API
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 401 });
    }

    const userId = session.user.id;

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .get();

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
      const existing = await db
        .select()
        .from(groups)
        .where(eq(groups.groupCode, candidateCode))
        .get();

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

    const groupId = crypto.randomUUID();
    const groupInsert = db.insert(groups).values({
      id: groupId,
      eventId,
      name,
      theme: theme || null,
      maxMembers: maxMembers || null,
      groupCode: groupCode,
      leaderUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const userGroupInsert = db.insert(userGroups).values({
      userId,
      groupId,
      eventId,
      status: "INTERESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const userEventInsert = db.insert(userEvents)
      .values({
        userId,
        eventId,
        groupId,
        status: "INTERESTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [userEvents.userId, userEvents.eventId],
        set: {
          groupId,
          updatedAt: new Date().toISOString(),
        },
      });

    if (typeof (db as any).batch === "function") {
      await (db as any).batch([groupInsert, userGroupInsert, userEventInsert]);
    } else {
      await db.transaction(async (tx: any) => {
        await tx.insert(groups).values({
          id: groupId,
          eventId,
          name,
          theme: theme || null,
          maxMembers: maxMembers || null,
          groupCode: groupCode,
          leaderUserId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await tx.insert(userGroups).values({
          userId,
          groupId,
          eventId,
          status: "INTERESTED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await tx.insert(userEvents)
          .values({
            userId,
            eventId,
            groupId,
            status: "INTERESTED",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: [userEvents.userId, userEvents.eventId],
            set: {
              groupId,
              updatedAt: new Date().toISOString(),
            },
          });
      });
    }

    const result = { id: groupId, groupCode };

    return NextResponse.json({
      groupId: result.id,
      groupCode: result.groupCode,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("FOREIGN KEY") || errorMsg.includes("constraint")) {
      return NextResponse.json({ error: GROUP_CREATE_RELOGIN_MESSAGE }, { status: 409 });
    }
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: GROUP_CREATE_FAILURE_RELOGIN_MESSAGE },
      { status: 500 },
    );
  }
}
