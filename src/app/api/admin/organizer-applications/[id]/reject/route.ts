import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/organizer-applications/[id]/reject
// オーガナイザー申請却下API
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

    // 申請ステータスを却下に更新
    await prisma.organizerApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
    });

    // TODO: 却下通知メールを送信する場合はここに追加

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting organizer application:", error);
    return NextResponse.json(
      { error: "Failed to reject organizer application" },
      { status: 500 }
    );
  }
}

