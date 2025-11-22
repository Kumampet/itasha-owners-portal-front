import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events/[id]
// 個別のイベント情報をDBから取得するAPI
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        theme: true,
        description: true,
        event_date: true,
        entry_start_at: true,
        payment_due_at: true,
        original_url: true,
        approval_status: true,
        organizer_user: {
          select: {
            id: true,
            email: true,
            custom_profile_url: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event." },
      { status: 500 }
    );
  }
}

