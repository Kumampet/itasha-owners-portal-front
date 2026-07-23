import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, contactSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyDiscordContactReceived } from "@/lib/discord-admin-notify";

// POST /api/contact
// お問い合わせフォームを送信
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { title, name, email, content } = body;

    // バリデーション
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "お名前は必須です" },
        { status: 400 }
      );
    }

    if (!email || email.trim() === "") {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "お問い合わせ内容は必須です" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }

    // ログインしている場合は、ユーザーが存在するか確認してからsubmitter_idを設定
    let submitterId: string | null = null;
    if (session?.user?.id) {
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, session.user.id))
        .get();
      if (user) {
        submitterId = user.id;
      }
    }

    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(contactSubmissions).values({
      id: submissionId,
      title: title.trim(),
      name: name.trim(),
      email: email.trim(),
      content: content.trim(),
      submitterId: submitterId,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    notifyDiscordContactReceived({ id: submissionId });

    return NextResponse.json({
      id: submissionId,
      title: title.trim(),
      name: name.trim(),
      email: email.trim(),
      content: content.trim(),
      submitter_id: submitterId,
      status: "PENDING",
      created_at: now,
      updated_at: now,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact submission:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create contact submission: ${errorMessage}` },
      { status: 500 }
    );
  }
}
