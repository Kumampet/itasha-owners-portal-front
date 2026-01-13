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

    // セッションのユーザーIDがデータベースに存在するか確認
    let applicantId: string | null = null;
    if (session?.user?.id) {
      try {
        console.log(`[OrganizerApplication] Checking user existence for ID: ${session.user.id}`);
        const userExists = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        });
        if (userExists) {
          applicantId = session.user.id;
          console.log(`[OrganizerApplication] User found, setting applicant_id: ${applicantId}`);
        } else {
          console.warn(`[OrganizerApplication] User not found in database for ID: ${session.user.id}`);
        }
      } catch (error) {
        console.error("[OrganizerApplication] Error checking user existence:", error);
        // エラーが発生した場合はnullのまま（未ログインとして扱う）
      }
    } else {
      console.log("[OrganizerApplication] No session or user ID, applicant_id will be null");
    }

    // 申請を作成
    // @ts-expect-error - Prisma Client Proxyの型推論の問題（実行時には正常に動作する）
    const application = await prisma.organizerApplication.create({
      data: {
        display_name,
        email,
        experience,
        applicant_id: applicantId,
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

