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
        created_by_user_id: true,
      },
    });

    if (!eventForCheck) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分が登録したイベントのみアクセス可能
    if (session.user?.role === "ORGANIZER" && eventForCheck.created_by_user_id !== session.user.id) {
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
        entry_selection_method: true,
        max_participants: true,
        created_by_user_id: true,
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

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      event,
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
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
        created_by_user_id: true,
        approval_status: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分が登録したイベントのみ更新可能
    if (session.user?.role === "ORGANIZER" && existingEvent.created_by_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const tags: string[] = body.tags || [];
    const approvalStatus = body.approval_status || existingEvent.approval_status;

    // 下書き状態から申請に変更する場合はバリデーションを適用
    if (existingEvent.approval_status === "DRAFT" && approvalStatus === "PENDING") {
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
      if (!body.entries || body.entries.length === 0) {
        return NextResponse.json(
          { error: "最低1つのエントリー情報が必要です" },
          { status: 400 }
        );
      }
      // エントリー情報の必須項目チェック
      for (const entry of body.entries) {
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

    // トランザクションでイベントとタグを同時に更新
    const event = await prisma.$transaction(async (tx) => {
      // 既存のタグを削除
      await tx.eventTag.deleteMany({
        where: { event_id: id },
      });

      // イベントを更新
      // created_by_user_idは変更しない（最初にイベントを作成したアカウントを保持）
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
          payment_methods: body.payment_methods || null,
          entry_selection_method: body.entry_selection_method || "FIRST_COME",
          max_participants: body.max_participants || null,
          // created_by_user_idは更新しない（最初の作成者を保持）
        },
      });

      // 既存のエントリー情報を削除
      await tx.eventEntry.deleteMany({
        where: { event_id: id },
      });

      // 新しいエントリー情報を作成
      if (body.entries && Array.isArray(body.entries)) {
        for (const entry of body.entries) {
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
              event_id: id,
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
          created_by_user_id: true,
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

