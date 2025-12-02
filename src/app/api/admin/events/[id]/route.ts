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
        description: true,
        event_date: true,
        event_end_date: true,
        is_multi_day: true,
        postal_code: true,
        prefecture: true,
        city: true,
        street_address: true,
        venue_name: true,
        keywords: true,
        official_urls: true,
        image_url: true,
        approval_status: true,
        organizer_email: true,
        organizer_user: {
          select: {
            id: true,
            email: true,
          },
        },
        entries: {
          select: {
            id: true,
            entry_number: true,
            entry_start_at: true,
            entry_start_public_at: true,
            entry_deadline_at: true,
            payment_due_type: true,
            payment_due_at: true,
            payment_due_days_after_entry: true,
            payment_due_public_at: true,
          },
          orderBy: {
            entry_number: "asc",
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

    // 主催者ユーザーIDの設定
    let organizerUserId: string | null = null;
    
    // 管理者権限の場合、organizer_user_idが直接指定されている場合はそれを使用
    if (session.user?.role === "ADMIN" && body.organizer_user_id) {
      // 指定されたユーザーがORGANIZER権限かどうかを確認
      const organizerUser = await prisma.user.findUnique({
        where: { id: body.organizer_user_id },
        select: { id: true, role: true, email: true },
      });
      
      if (organizerUser && organizerUser.role === "ORGANIZER") {
        organizerUserId = organizerUser.id;
      } else {
        return NextResponse.json(
          { error: "指定されたユーザーはORGANIZER権限ではありません" },
          { status: 400 }
        );
      }
    } else if (body.organizer_email) {
      // メールアドレスからユーザーを検索（既存のロジック）
      const organizerUser = await prisma.user.findUnique({
        where: { email: body.organizer_email },
        select: { id: true },
      });
      organizerUserId = organizerUser?.id || null;
    }

    // トランザクションでイベントとタグを同時に更新
    const event = await prisma.$transaction(async (tx) => {
      // 既存のタグを削除
      await tx.eventTag.deleteMany({
        where: { event_id: id },
      });

      // イベントを更新
      await tx.event.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description || null,
          event_date: new Date(body.event_date),
          event_end_date: body.event_end_date ? new Date(body.event_end_date) : null,
          is_multi_day: body.is_multi_day || false,
          postal_code: body.postal_code || null,
          prefecture: body.prefecture || null,
          city: body.city || null,
          street_address: body.street_address || null,
          venue_name: body.venue_name || null,
          keywords: body.keywords || null,
          official_urls: body.official_urls || [],
          image_url: body.image_url || null,
          approval_status: body.approval_status,
          organizer_email: body.organizer_email || null,
          organizer_user_id: organizerUserId,
        },
      });

      // 既存のエントリー情報を削除
      await tx.eventEntry.deleteMany({
        where: { event_id: id },
      });

      // 新しいエントリー情報を作成
      if (body.entries && Array.isArray(body.entries)) {
        for (const entry of body.entries) {
          await tx.eventEntry.create({
            data: {
              event_id: id,
              entry_number: entry.entry_number,
              entry_start_at: new Date(entry.entry_start_at),
              entry_start_public_at: entry.entry_start_public_at
                ? new Date(entry.entry_start_public_at)
                : null,
              entry_deadline_at: new Date(entry.entry_deadline_at),
              payment_due_type: entry.payment_due_type || "ABSOLUTE",
              payment_due_at: entry.payment_due_type === "ABSOLUTE" && entry.payment_due_at
                ? new Date(entry.payment_due_at)
                : null,
              payment_due_days_after_entry: entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry
                ? entry.payment_due_days_after_entry
                : null,
              payment_due_public_at: entry.payment_due_public_at
                ? new Date(entry.payment_due_public_at)
                : null,
            },
          });
        }
      }

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
          description: true,
          event_date: true,
          event_end_date: true,
          is_multi_day: true,
          postal_code: true,
          prefecture: true,
          city: true,
          street_address: true,
          venue_name: true,
          keywords: true,
          official_urls: true,
          image_url: true,
          approval_status: true,
          organizer_email: true,
          organizer_user: {
            select: {
              id: true,
              email: true,
            },
          },
          entries: {
            select: {
              id: true,
              entry_number: true,
              entry_start_at: true,
              entry_start_public_at: true,
              entry_deadline_at: true,
              payment_due_at: true,
              payment_due_public_at: true,
            },
            orderBy: {
              entry_number: "asc",
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

    // キャッシュを無効化（一覧と個別イベントの両方）
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    revalidateTag(`event-${id}`, {});

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

