import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // メールアドレスの形式チェック（簡易版）
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
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (user) {
        submitterId = user.id;
      }
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        title: title.trim(),
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        submitter_id: submitterId,
        status: "PENDING",
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating contact submission:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create contact submission: ${errorMessage}` },
      { status: 500 }
    );
  }
}

