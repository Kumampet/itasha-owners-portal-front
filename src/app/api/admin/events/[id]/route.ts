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

    // 管理者またはオーガナイザーの権限チェック
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // イベントを取得して権限チェック
    const eventForCheck = await prisma.event.findUnique({
      where: { id },
      select: {
        organizer_user_id: true,
      },
    });

    if (!eventForCheck) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分のイベントのみアクセス可能
    if (session.user?.role === "ORGANIZER" && eventForCheck.organizer_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

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
        postal_code: true,
        prefecture: true,
        city: true,
        street_address: true,
        venue_name: true,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch event", message: errorMessage },
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

    // 管理者またはオーガナイザーの権限チェック
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // イベントを取得して権限チェック
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        organizer_user_id: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分のイベントのみ更新可能
    if (session.user?.role === "ORGANIZER" && existingEvent.organizer_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const tags: string[] = body.tags || [];

    // トランザクションでイベントとタグを同時に更新
    const event = await prisma.$transaction(async (tx) => {
      // 既存のタグを削除
      await tx.eventTag.deleteMany({
        where: { event_id: id },
      });

      // イベントを更新
      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
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
          postal_code: body.postal_code || null,
          prefecture: body.prefecture || null,
          city: body.city || null,
          street_address: body.street_address || null,
          venue_name: body.venue_name || null,
          approval_status: body.approval_status,
        },
      });

      // タグを処理
      if (tags.length > 0) {
        for (const tagName of tags) {
          // タグが存在するか確認、存在しない場合は作成
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {
              usage_count: {
                increment: 1,
              },
            },
            create: {
              name: tagName,
              usage_count: 1,
            },
          });

          // EventTagを作成
          await tx.eventTag.create({
            data: {
              event_id: id,
              tag_id: tag.id,
            },
          });
        }
      }

      // 更新したイベントを取得（タグ情報を含む）
      return await tx.event.findUnique({
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
    });

    // キャッシュを無効化
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

