import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events/[id]
// 管理画面用のイベント詳細取得API
export async function GET(
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

    const event = await prisma.event.findUnique({
      where: { id },
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
        organizer_user: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/events/[id]
// 管理画面用のイベント更新API
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

    const updateData: any = {
      name: body.name,
      theme: body.theme || null,
      description: body.description || null,
      original_url: body.original_url,
      event_date: new Date(body.event_date),
      entry_start_at: body.entry_start_at
        ? new Date(body.entry_start_at)
        : null,
      payment_due_at: body.payment_due_at
        ? new Date(body.payment_due_at)
        : null,
      approval_status: body.approval_status,
    };

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
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
        organizer_user: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // キャッシュを無効化
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events");

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

