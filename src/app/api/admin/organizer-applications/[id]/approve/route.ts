import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/organizer-applications/[id]/approve
// オーガナイザー申請承認API
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 申請を取得
    const application = await prisma.organizerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application is not pending" },
        { status: 400 }
      );
    }

    // 既存ユーザーを確認
    const existingUser = await prisma.user.findUnique({
      where: { email: application.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスで登録されているユーザーが見つかりません。まず一般アプリでGoogleまたはX認証でログインしてください。" },
        { status: 400 }
      );
    }

    // 既存ユーザーの場合、権限を更新
    if (existingUser.role === "ORGANIZER" || existingUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "このメールアドレスは既にオーガナイザーまたは管理者として登録されています" },
        { status: 400 }
      );
    }

    // 一般ユーザーの場合、権限をオーガナイザーに変更
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "ORGANIZER",
        display_name: application.display_name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // 申請ステータスを承認済みに更新
    await prisma.organizerApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error approving organizer application:", error);
    return NextResponse.json(
      { error: "Failed to approve organizer application" },
      { status: 500 }
    );
  }
}

