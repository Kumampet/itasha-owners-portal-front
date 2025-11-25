import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/submissions/[id]/process
// 情報提供の処理ステータスを更新するAPI
export async function POST(
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

    if (!body.status || !["PROCESSED", "REJECTED"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const submission = await prisma.eventSubmission.update({
      where: { id },
      data: { status: body.status },
      select: {
        id: true,
        name: true,
        theme: true,
        description: true,
        original_url: true,
        event_date: true,
        entry_start_at: true,
        payment_due_at: true,
        status: true,
        admin_note: true,
        submitter_email: true,
        submitter: {
          select: {
            email: true,
          },
        },
        created_at: true,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

