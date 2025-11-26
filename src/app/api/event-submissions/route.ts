import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/event-submissions
// イベント掲載依頼フォームを送信
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { name, original_url, event_date, description, theme, entry_start_at, payment_due_at } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "イベント名は必須です" },
        { status: 400 }
      );
    }

    const submission = await prisma.eventSubmission.create({
      data: {
        name: name.trim(),
        original_url: original_url?.trim() || null,
        event_date: event_date ? new Date(event_date) : null,
        description: description?.trim() || null,
        theme: theme?.trim() || null,
        entry_start_at: entry_start_at ? new Date(entry_start_at) : null,
        payment_due_at: payment_due_at ? new Date(payment_due_at) : null,
        submitter_id: session?.user?.id || null,
        submitter_email: session?.user?.email || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating event submission:", error);
    return NextResponse.json(
      { error: "Failed to create event submission" },
      { status: 500 }
    );
  }
}

