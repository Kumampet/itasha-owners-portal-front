import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    const nowStr = new Date().toISOString();

    await db
      .update(eventSubmissions)
      .set({
        status: body.status,
        updatedAt: nowStr,
      })
      .where(eq(eventSubmissions.id, id));

    const submission = await db.query.eventSubmissions.findFirst({
      where: eq(eventSubmissions.id, id),
      with: {
        user: { // submitter
          columns: {
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // レスポンス整形
    const formatted = {
      id: submission.id,
      name: submission.name,
      venue_name: submission.venueName,
      theme: submission.theme,
      description: submission.description,
      original_url: submission.originalUrl,
      event_date: submission.eventDate ? new Date(submission.eventDate).toISOString() : null,
      entry_start_at: submission.entryStartAt ? new Date(submission.entryStartAt).toISOString() : null,
      payment_due_at: submission.paymentDueAt ? new Date(submission.paymentDueAt).toISOString() : null,
      status: submission.status,
      admin_note: submission.adminNote,
      submitter_email: submission.submitterEmail,
      submitter: submission.user ? {
        email: submission.user.email,
      } : null,
      created_at: new Date(submission.createdAt).toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
