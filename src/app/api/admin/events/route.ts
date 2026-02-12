import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events
// 管理画面用のイベント一覧取得API（全ステータス、ソート・絞り込み対応）
export async function GET(request: Request) {
  try {
    const session = await auth();

    // 管理者またはオーガナイザー権限チェック
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER")) {
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const requestedLimit = parseInt(searchParams.get("limit") || "20", 10);
    // 管理画面では最大20件まで
    const limit = Math.min(requestedLimit, 20);

    const now = new Date();

    // 過去のイベントを除外する条件（終了日がある場合は終了日、ない場合は開始日で判定）
    const dateFilter = {
      OR: [
        {
          AND: [
            { event_end_date: { not: null } },
            { event_end_date: { gte: now } },
          ],
        },
        {
          AND: [
            { event_end_date: null },
            { event_date: { gte: now } },
          ],
        },
      ],
    };

    // フィルター条件を構築
    const where: Record<string, unknown> = {};
    
    // AND条件の配列を構築
    const andConditions: unknown[] = [dateFilter];
    
    // オーガナイザーの場合、自分が登録したイベントのみを表示
    if (session.user?.role === "ORGANIZER" && session.user?.id) {
      andConditions.push({ created_by_user_id: session.user.id });
    }
    
    if (status && status !== "ALL") {
      andConditions.push({ approval_status: status });
    }
    
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      });
    }
    
    // すべての条件をANDで結合
    where.AND = andConditions;

    // ソート条件を構築
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // 総件数を取得
    const totalCount = await prisma.event.count({ where });

    // ページネーションでイベントを取得
    const skip = (page - 1) * limit;
    const events = await prisma.event.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        event_date: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event_end_date: true as any,
        is_multi_day: true,
        approval_status: true,
        created_at: true,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    const totalPages = Math.ceil(totalCount / limit);

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      {
        events,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
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

    // 管理者またはオーガナイザー権限チェック
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "ORGANIZER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const keywords: string[] = body.keywords || [];
    const entries = body.entries || [];
    const approvalStatus = body.approval_status || "DRAFT";

    // 下書き保存の場合はバリデーションをスキップ
    // 申請の場合は通常のバリデーションを適用
    if (approvalStatus === "PENDING") {
      // 必須項目のバリデーション
      if (!body.name || !body.description || !body.event_date) {
        return NextResponse.json(
          { error: "必須項目が不足しています" },
          { status: 400 }
        );
      }
      // エントリー決定方法のバリデーション
      if (!body.entry_selection_method || !["FIRST_COME", "LOTTERY", "SELECTION"].includes(body.entry_selection_method)) {
        return NextResponse.json(
          { error: "エントリー決定方法を選択してください" },
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
      // エントリー情報の必須項目チェック
      for (const entry of entries) {
        if (!entry.entry_start_at) {
          return NextResponse.json(
            { error: `エントリー${entry.entry_number}の開始日時が必要です` },
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
    }

    // エントリー情報のバリデーション（下書き・申請共通）
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

    // トランザクションでイベント、エントリー情報、キーワードを同時に作成
    const event = await prisma.$transaction(async (tx) => {
      // イベントを作成
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        official_urls: (body.official_urls || []).filter((url: string) => url && url.trim() !== ""), // 空文字列を除外したURL配列
        image_url: body.image_url || null,
        approval_status: body.approval_status || "DRAFT",
        payment_methods: body.payment_methods || null,
        entry_selection_method: body.entry_selection_method || "FIRST_COME",
        max_participants: body.max_participants || null,
      };

      // イベント登録者（イベントを登録したアカウント）を設定
      if (session.user?.id) {
        eventData.created_by_user_id = session.user.id;
      }

      const createdEvent = await tx.event.create({
        data: eventData,
      });

      // エントリー情報を作成
      // 下書き保存時は、entry_start_atが空の場合はスキップ
      for (const entry of entries) {
        // entry_start_atが必須項目なので、空の場合はスキップ（下書き保存時のみ）
        if (approvalStatus === "DRAFT" && (!entry.entry_start_at || typeof entry.entry_start_at !== "string" || entry.entry_start_at.trim() === "")) {
          continue;
        }

        // entry_start_atが有効な値かチェック
        const entryStartAt = entry.entry_start_at && typeof entry.entry_start_at === "string" && entry.entry_start_at.trim() !== ""
          ? new Date(entry.entry_start_at)
          : null;

        if (!entryStartAt || isNaN(entryStartAt.getTime())) {
          // 下書き保存時はスキップ、申請時はエラー（バリデーションで既にチェック済み）
          if (approvalStatus === "DRAFT") {
            continue;
          }
          return NextResponse.json(
            { error: `エントリー${entry.entry_number}の開始日時が無効です` },
            { status: 400 }
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any).eventEntry.create({
          data: {
            event_id: createdEvent.id,
            entry_number: entry.entry_number,
            entry_start_at: entryStartAt,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          entry_selection_method: true,
          max_participants: true,
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
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    // キャッシュを無効化（新規作成時は一覧と個別の両方）
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    if (event && typeof event === "object" && "id" in event) {
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
