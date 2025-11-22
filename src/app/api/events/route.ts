import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        event_date: "asc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        theme: true,
        description: true,
        original_url: true,
        event_date: true,
        entry_start_at: true,
        payment_due_at: true,
        approval_status: true,
      },
    });

    return NextResponse.json(
      events.map((event) => ({
        ...event,
        event_date: event.event_date.toISOString(),
        entry_start_at: event.entry_start_at?.toISOString() ?? null,
        payment_due_at: event.payment_due_at?.toISOString() ?? null,
      })),
    );
  } catch (error) {
    console.error("Failed to fetch events", error);
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 },
    );
  }
}


