import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOrganizerAccountEmail } from "@/lib/ses";

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

    let user;
    if (existingUser) {
      // 既存ユーザーの場合、権限を更新
      if (existingUser.role === "ORGANIZER" || existingUser.role === "ADMIN") {
        return NextResponse.json(
          { error: "このメールアドレスは既にオーガナイザーまたは管理者として登録されています" },
          { status: 400 }
        );
      }
      // 一般ユーザーの場合、権限をオーガナイザーに変更
      user = await prisma.user.update({
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
    } else {
      // 新規ユーザーの場合、パスワードを生成してアカウントを作成
      const passwordLength = 12;
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < passwordLength; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 10);

      // オーガナイザーアカウントを作成
      user = await prisma.user.create({
        data: {
          email: application.email,
          name: application.display_name,
          display_name: application.display_name,
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

      // メール送信（新規ユーザーの場合のみ）
      try {
        await sendOrganizerAccountEmail({
          to: application.email,
          email: application.email,
          password,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // メール送信に失敗してもアカウントは作成されているので、警告のみ
      }
    }

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

