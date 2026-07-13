import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyDiscordEventListingRequest } from "@/lib/discord-admin-notify";
import { fromDateLocal } from "@/lib/date-utils";

function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

// POST /api/event-submissions
// イベント掲載依頼フォームを送信
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { name, original_url, event_date, venue_name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "イベント名は必須です" }, { status: 400 });
    }

    if (!venue_name || typeof venue_name !== "string" || venue_name.trim() === "") {
      return NextResponse.json({ error: "会場・住所は必須です" }, { status: 400 });
    }

    if (!original_url || typeof original_url !== "string") {
      return NextResponse.json({ error: "イベント情報URLは必須です" }, { status: 400 });
    }
    if (!parseHttpUrl(original_url)) {
      return NextResponse.json({ error: "イベント情報URLの形式が正しくありません" }, { status: 400 });
    }

    if (!event_date || typeof event_date !== "string" || event_date.trim() === "") {
      return NextResponse.json({ error: "開催日は必須です" }, { status: 400 });
    }
    const eventDateParsed = fromDateLocal(event_date);
    if (!eventDateParsed) {
      return NextResponse.json({ error: "開催日の形式が正しくありません" }, { status: 400 });
    }

    const submission = await prisma.eventSubmission.create({
      data: {
        name: name.trim(),
        venue_name: venue_name.trim(),
        original_url: original_url.trim(),
        event_date: eventDateParsed,
        description: typeof description === "string" ? description.trim() || null : null,
        submitter_id: session?.user?.id || null,
        submitter_email: session?.user?.email || null,
        status: "PENDING",
      },
    });

    notifyDiscordEventListingRequest({
      id: submission.id,
      name: submission.name,
      originalUrl: submission.original_url,
      venue_name: submission.venue_name,
      eventDateIso: submission.event_date?.toISOString() ?? null,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating event submission:", error);
    return NextResponse.json({ error: "Failed to create event submission" }, { status: 500 });
  }
}
