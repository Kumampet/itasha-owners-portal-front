import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/contacts/[id]
// お問い合わせのステータスとメモを更新
export async function PATCH(
  request: Request,
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
    const body = await request.json();
    const { status, admin_note } = body;

    // ステータスのバリデーション
    if (status && !["PENDING", "PROCESSING", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(admin_note !== undefined && { admin_note }),
      },
      select: {
        id: true,
        title: true,
        name: true,
        email: true,
        content: true,
        status: true,
        admin_note: true,
        submitter: {
          select: {
            email: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

