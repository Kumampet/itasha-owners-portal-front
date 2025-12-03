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
        description: true,
        event_date: true,
        event_end_date: true as any,
        is_multi_day: true,
        approval_status: true,
        created_at: true,
        organizer_user: {
          select: {
            email: true,
          },
        },
        entries: {
          select: {
            entry_number: true,
            entry_start_at: true,
            entry_deadline_at: true,
            payment_due_at: true,
          },
          orderBy: {
            entry_number: "asc",
          },
        },
      } as any,
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
    const keywords: string[] = body.keywords || [];
    const entries = body.entries || [];

    // バリデーション
    if (!body.name || !body.description || !body.event_date) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }
    // 空文字列を除外してバリデーション
    const validUrls = (body.official_urls || []).filter((url: string) => url && url.trim() !== "");
    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "最低1つの公式サイトURLが必要です" },
        { status: 400 }
      );
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "最低1つのエントリー情報が必要です" },
        { status: 400 }
      );
    }
    // エントリー情報のバリデーション
    for (const entry of entries) {
      // エントリー締め切り日時と支払期限は任意項目のため、バリデーションを削除
      // 支払期限タイプがRELATIVEの場合、日数が指定されている場合は1日以上であることを確認
      if (entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry && entry.payment_due_days_after_entry < 1) {
        return NextResponse.json(
          { error: `エントリー${entry.entry_number}の支払期限日数は1日以上である必要があります` },
          { status: 400 }
        );
      }
    }
    if (body.is_multi_day && !body.event_end_date) {
      return NextResponse.json(
        { error: "複数日開催の場合、終了日が必要です" },
        { status: 400 }
      );
    }

    // イベント作成者（最初にイベントを作成したアカウント）を自動設定
    // organizer_emailが指定されていない場合は、ログインユーザーのメールアドレスを使用
    const organizerEmail = body.organizer_email || session.user?.email || "";
    if (!organizerEmail) {
      return NextResponse.json(
        { error: "主催者メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // 主催者メールアドレスからユーザーを検索
    // organizer_user_idが指定されていない場合は、ログインユーザーのIDを使用
    let organizerUserId: string | null = null;
    if (body.organizer_user_id && typeof body.organizer_user_id === "string" && body.organizer_user_id.trim() !== "") {
      // 指定されたユーザーIDを使用
      const organizerUser = await prisma.user.findUnique({
        where: { id: body.organizer_user_id },
        select: { id: true },
      });
      organizerUserId = organizerUser?.id || null;
    } else if (organizerEmail) {
      // メールアドレスからユーザーを検索
      const organizerUser = await prisma.user.findUnique({
        where: { email: organizerEmail },
        select: { id: true },
      });
      organizerUserId = organizerUser?.id || null;
    }

    // メールアドレスからユーザーが見つからない場合、ログインユーザーのIDを使用
    if (!organizerUserId && session.user?.id) {
      organizerUserId = session.user.id;
    }

    // トランザクションでイベント、エントリー情報、キーワードを同時に作成
    const event = await prisma.$transaction(async (tx) => {
      // イベントを作成
      const eventData: any = {
        name: body.name,
        description: body.description,
        event_date: new Date(body.event_date),
        is_multi_day: body.is_multi_day || false,
        event_end_date: body.event_end_date ? new Date(body.event_end_date) : null,
        postal_code: body.postal_code || null,
        prefecture: body.prefecture || null,
        city: body.city || null,
        street_address: body.street_address || null,
        venue_name: body.venue_name || null,
        keywords: keywords.length > 0 ? keywords : undefined,
        official_urls: validUrls, // 空文字列を除外したURL配列
        image_url: body.image_url || null,
        approval_status: body.approval_status || "DRAFT",
        organizer_email: organizerEmail,
        payment_methods: body.payment_methods || null,
      };

      // organizer_user_idがnullでない場合のみ設定
      if (organizerUserId) {
        eventData.organizer_user_id = organizerUserId;
      }

      // イベント作成者（最初にイベントを作成したアカウント）を設定
      if (session.user?.id) {
        eventData.created_by_user_id = session.user.id;
      }

      const createdEvent = await tx.event.create({
        data: eventData,
      });

      // エントリー情報を作成
      for (const entry of entries) {
        await (tx as any).eventEntry.create({
          data: {
            event_id: createdEvent.id,
            entry_number: entry.entry_number,
            entry_start_at: new Date(entry.entry_start_at),
            entry_start_public_at: entry.entry_start_public_at && typeof entry.entry_start_public_at === "string" && entry.entry_start_public_at.trim() !== ""
              ? new Date(entry.entry_start_public_at)
              : null,
            entry_deadline_at: entry.entry_deadline_at && typeof entry.entry_deadline_at === "string" && entry.entry_deadline_at.trim() !== ""
              ? new Date(entry.entry_deadline_at)
              : null,
            payment_due_type: entry.payment_due_type || "ABSOLUTE",
            payment_due_at: entry.payment_due_type === "ABSOLUTE" && entry.payment_due_at && typeof entry.payment_due_at === "string" && entry.payment_due_at.trim() !== ""
              ? new Date(entry.payment_due_at)
              : null,
            payment_due_days_after_entry: entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry
              ? entry.payment_due_days_after_entry
              : null,
            payment_due_public_at: entry.payment_due_public_at && typeof entry.payment_due_public_at === "string" && entry.payment_due_public_at.trim() !== ""
              ? new Date(entry.payment_due_public_at)
              : null,
          },
        });
      }

      // 作成したイベントを取得（エントリー情報を含む）
      return await tx.event.findUnique({
        where: { id: createdEvent.id },
        select: {
          id: true,
          name: true,
          description: true,
          event_date: true,
          event_end_date: true as any,
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
          entries: {
            select: {
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
        } as any,
      });
    });

    // キャッシュを無効化（新規作成時は一覧と個別の両方）
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    if (event?.id) {
      revalidateTag(`event-${event.id}`, {});
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
