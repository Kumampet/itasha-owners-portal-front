import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/organizer-applications
// オーガナイザー登録申請API
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { display_name, email, experience } = body;

    // 必須項目のチェック
    if (!display_name || !email || !experience) {
      return NextResponse.json(
        { error: "表示名、メールアドレス、歴代の運営実績は必須です" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // 申請を作成
    const application = await prisma.organizerApplication.create({
      data: {
        display_name,
        email,
        experience,
        applicant_id: session?.user?.id || null,
        status: "PENDING",
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating organizer application:", error);
    return NextResponse.json(
      { error: "申請の送信に失敗しました" },
      { status: 500 }
    );
  }
}

