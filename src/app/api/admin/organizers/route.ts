import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOrganizerAccountEmail } from "@/lib/ses";

// POST /api/admin/organizers
// オーガナイザーアカウント作成API
export async function POST(request: Request) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 既存ユーザーを確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // オーガナイザーアカウントを作成
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: "ORGANIZER",
        must_change_password: true, // 初回ログイン時にパスワード変更を強制
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        must_change_password: true,
      },
    });

    // メール送信
    try {
      await sendOrganizerAccountEmail({
        to: email,
        email,
        password,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // メール送信に失敗してもアカウントは作成されているので、警告のみ
      // 本番環境では、メール送信に失敗した場合はロールバックするか、管理者に通知する
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating organizer account:", error);
    return NextResponse.json(
      { error: "Failed to create organizer account" },
      { status: 500 }
    );
  }
}

