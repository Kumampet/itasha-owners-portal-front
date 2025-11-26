import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events
// 管理画面用のイベント一覧取得API（全ステータス、ソート・絞り込み対応）
export async function GET(request: Request) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");

    // フィルター条件を構築
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.approval_status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { theme: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // ソート条件を構築
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const events = await prisma.event.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        theme: true,
        description: true,
        event_date: true,
        entry_start_at: true,
        payment_due_at: true,
        approval_status: true,
        created_at: true,
        organizer_user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events
// 管理画面用のイベント作成API
export async function POST(request: Request) {
  try {
    const session = await auth();

    // 管理者権限チェック
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tags: string[] = body.tags || [];

    // 主催者メールアドレスからユーザーを検索
    let organizerUserId: string | null = null;
    if (body.organizer_email) {
      const organizerUser = await prisma.user.findUnique({
        where: { email: body.organizer_email },
        select: { id: true },
      });
      organizerUserId = organizerUser?.id || null;
    }

    // トランザクションでイベントとタグを同時に作成
    const event = await prisma.$transaction(async (tx) => {
      // イベントを作成
      const createdEvent = await tx.event.create({
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
          approval_status: body.approval_status || "DRAFT",
          organizer_email: body.organizer_email || null,
          organizer_user_id: organizerUserId,
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
              event_id: createdEvent.id,
              tag_id: tag.id,
            },
          });
        }
      }

      // 作成したイベントを取得（タグ情報を含む）
      return await tx.event.findUnique({
        where: { id: createdEvent.id },
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
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
