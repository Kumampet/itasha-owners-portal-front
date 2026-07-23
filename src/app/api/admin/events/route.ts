import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { events, eventEntries } from "@/db/schema";
import { eq, and, or, asc, desc, isNull, isNotNull, like, notInArray, sql } from "drizzle-orm";
import { scheduleMergeApprovedEventIntoSitemapOnS3 } from "@/lib/events-sitemap-s3";
import { fromDateTimeLocal, fromDateLocal } from "@/lib/date-utils";
import { notifyDiscordEventApprovalRequested } from "@/lib/discord-admin-notify";
import { EVENT_DESCRIPTION_MAX_CHARS } from "@/lib/event-description";

// GET /api/admin/events
// 管理画面用のイベント一覧取得API
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
    const noEntryStart = searchParams.get("noEntryStart") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const requestedLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(requestedLimit, 20);

    const now = new Date();
    const nowStr = now.toISOString();

    // 過去のイベントを除外する条件
    const dateFilterCondition = or(
      and(isNotNull(events.eventEndDate), sql`${events.eventEndDate} >= ${nowStr}`),
      and(isNull(events.eventEndDate), sql`${events.eventDate} >= ${nowStr}`)
    );

    const andConditions: any[] = [dateFilterCondition];

    // オーガナイザーの場合、自分が登録したイベントのみを表示
    if (session.user?.role === "ORGANIZER" && session.user?.id) {
      andConditions.push(eq(events.createdByUserId, session.user.id));
    }

    if (status && status !== "ALL") {
      andConditions.push(eq(events.approvalStatus, status));
    }

    if (search) {
      andConditions.push(
        or(
          like(events.name, `%${search}%`),
          like(events.description, `%${search}%`)
        )
      );
    }

    // エントリー開始日時未登録フィルター
    if (noEntryStart) {
      const hasStartEntrySubquery = db
        .select({ eventId: eventEntries.eventId })
        .from(eventEntries)
        .where(isNotNull(eventEntries.entryStartAt));

      andConditions.push(notInArray(events.id, hasStartEntrySubquery));
    }

    // 総件数を取得
    const totalCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...andConditions));
    const totalCount = totalCountRes[0]?.count || 0;

    // ソート条件
    let sortCol: any = events.createdAt;
    if (sortBy === "event_date") {
      sortCol = events.eventDate;
    }

    const offset = (page - 1) * limit;

    const eventsList = await db.query.events.findMany({
      where: and(...andConditions),
      orderBy: sortOrder === "asc" ? asc(sortCol) : desc(sortCol),
      offset: offset,
      limit: limit,
      with: {
        eventEntries: {
          columns: {
            entryNumber: true,
            entryStartAt: true,
            entryDeadlineAt: true,
            paymentDueAt: true,
          },
          orderBy: asc(eventEntries.entryNumber),
        },
      },
    });

    // キャメルケースからスネークケースへのマッピング対応（GET互換性のため）
    const formattedEvents = eventsList.map((ev: any) => {
      return {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        event_date: new Date(ev.eventDate).toISOString(),
        event_end_date: ev.eventEndDate ? new Date(ev.eventEndDate).toISOString() : null,
        is_multi_day: ev.isMultiDay,
        approval_status: ev.approvalStatus,
        created_at: new Date(ev.createdAt).toISOString(),
        entries: (ev.eventEntries || []).map((e: any) => ({
          entry_number: e.entryNumber,
          entry_start_at: e.entryStartAt ? new Date(e.entryStartAt).toISOString() : null,
          entry_deadline_at: e.entryDeadlineAt ? new Date(e.entryDeadlineAt).toISOString() : null,
          payment_due_at: e.paymentDueAt ? new Date(e.paymentDueAt).toISOString() : null,
        })),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        events: formattedEvents,
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
    if (
      typeof body.description === "string" &&
      body.description.length > EVENT_DESCRIPTION_MAX_CHARS
    ) {
      return NextResponse.json(
        {
          error: `イベント概要文は${EVENT_DESCRIPTION_MAX_CHARS}文字以内で入力してください`,
        },
        { status: 400 }
      );
    }
    const keywords: string[] = body.keywords || [];
    const entriesList = body.entries || [];
    const approvalStatus = body.approval_status || "DRAFT";

    // 申請の場合は通常のバリデーションを適用
    if (approvalStatus === "PENDING") {
      if (!body.name || !body.description || !body.event_date) {
        return NextResponse.json(
          { error: "必須項目が不足しています" },
          { status: 400 }
        );
      }
      if (!body.entry_selection_method || !["FIRST_COME", "LOTTERY", "SELECTION"].includes(body.entry_selection_method)) {
        return NextResponse.json(
          { error: "エントリー決定方法を選択してください" },
          { status: 400 }
        );
      }
      const validUrls = (body.official_urls || []).filter((url: string) => url && url.trim() !== "");
      if (validUrls.length === 0) {
        return NextResponse.json(
          { error: "最低1つの公式サイトURLが必要です" },
          { status: 400 }
        );
      }
      if (!entriesList || entriesList.length === 0) {
        return NextResponse.json(
          { error: "最低1つのエントリー情報が必要です" },
          { status: 400 }
        );
      }
      if (body.is_multi_day && !body.event_end_date) {
        return NextResponse.json(
          { error: "複数日開催の場合、終了日が必要です" },
          { status: 400 }
        );
      }
    }

    // エントリー情報のバリデーション
    for (const entry of entriesList) {
      if (entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry && entry.payment_due_days_after_entry < 1) {
        return NextResponse.json(
          { error: `エントリー${entry.entry_number}の支払期限日数は1日以上である必要があります` },
          { status: 400 }
        );
      }
    }

    // event_dateを変換
    const eventDate = fromDateLocal(body.event_date);
    if (!eventDate) {
      return NextResponse.json(
        { error: "開催日が無効です" },
        { status: 400 }
      );
    }

    const eventId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    const eventInsertQuery = db.insert(events).values({
      id: eventId,
      name: body.name,
      description: body.description,
      eventDate: eventDate.toISOString(),
      isMultiDay: body.is_multi_day || false,
      eventEndDate: body.event_end_date ? fromDateLocal(body.event_end_date)?.toISOString() : null,
      postalCode: body.postal_code || null,
      prefecture: body.prefecture || null,
      city: body.city || null,
      streetAddress: body.street_address || null,
      venueName: body.venue_name || null,
      keywords: keywords.length > 0 ? JSON.stringify(keywords) : null,
      officialUrls: body.official_urls ? JSON.stringify(body.official_urls.filter((url: string) => url && url.trim() !== "")) : "[]",
      imageUrl: body.image_url || null,
      approvalStatus: approvalStatus,
      paymentMethods: body.payment_methods ? JSON.stringify(body.payment_methods) : null,
      entrySelectionMethod: body.entry_selection_method || "FIRST_COME",
      maxParticipants: body.max_participants || null,
      createdByUserId: session.user.id,
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    const entryQueries: any[] = [];
    for (const entry of entriesList) {
      const entryStartAt = fromDateTimeLocal(entry.entry_start_at);

      if (entry.entry_start_at && typeof entry.entry_start_at === "string" && entry.entry_start_at.trim() !== "") {
        if (!entryStartAt) {
          throw new Error(`エントリー${entry.entry_number}の開始日時が無効です`);
        }
      }

      const entryId = crypto.randomUUID();
      entryQueries.push(
        db.insert(eventEntries).values({
          id: entryId,
          eventId: eventId,
          entryNumber: entry.entry_number,
          entryStartAt: entryStartAt ? entryStartAt.toISOString() : null,
          entryStartPublicAt: fromDateTimeLocal(entry.entry_start_public_at) ? fromDateTimeLocal(entry.entry_start_public_at)!.toISOString() : null,
          entryDeadlineAt: fromDateTimeLocal(entry.entry_deadline_at) ? fromDateTimeLocal(entry.entry_deadline_at)!.toISOString() : null,
          paymentDueType: entry.payment_due_type || "ABSOLUTE",
          paymentDueAt: entry.payment_due_type === "ABSOLUTE" && fromDateTimeLocal(entry.payment_due_at)
            ? fromDateTimeLocal(entry.payment_due_at)!.toISOString()
            : null,
          paymentDueDaysAfterEntry: entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry
            ? entry.payment_due_days_after_entry
            : null,
          paymentDuePublicAt: fromDateTimeLocal(entry.payment_due_public_at)
            ? fromDateTimeLocal(entry.payment_due_public_at)!.toISOString()
            : null,
          createdAt: nowStr,
          updatedAt: nowStr,
        })
      );
    }

    let createdEvent;
    if (typeof (db as any).batch === "function") {
      await (db as any).batch([eventInsertQuery, ...entryQueries]);
      createdEvent = await db.query.events.findFirst({
        where: eq(events.id, eventId),
        with: {
          eventEntries: {
            orderBy: asc(eventEntries.entryNumber),
          },
        },
      });
    } else {
      createdEvent = await db.transaction(async (tx: any) => {
        await tx.insert(events).values({
          id: eventId,
          name: body.name,
          description: body.description,
          eventDate: eventDate.toISOString(),
          isMultiDay: body.is_multi_day || false,
          eventEndDate: body.event_end_date ? fromDateLocal(body.event_end_date)?.toISOString() : null,
          postalCode: body.postal_code || null,
          prefecture: body.prefecture || null,
          city: body.city || null,
          streetAddress: body.street_address || null,
          venueName: body.venue_name || null,
          keywords: keywords.length > 0 ? JSON.stringify(keywords) : null,
          officialUrls: body.official_urls ? JSON.stringify(body.official_urls.filter((url: string) => url && url.trim() !== "")) : "[]",
          imageUrl: body.image_url || null,
          approvalStatus: approvalStatus,
          paymentMethods: body.payment_methods ? JSON.stringify(body.payment_methods) : null,
          entrySelectionMethod: body.entry_selection_method || "FIRST_COME",
          maxParticipants: body.max_participants || null,
          createdByUserId: session.user.id,
          createdAt: nowStr,
          updatedAt: nowStr,
        });

        for (const entry of entriesList) {
          const entryStartAt = fromDateTimeLocal(entry.entry_start_at);

          if (entry.entry_start_at && typeof entry.entry_start_at === "string" && entry.entry_start_at.trim() !== "") {
            if (!entryStartAt) {
              throw new Error(`エントリー${entry.entry_number}の開始日時が無効です`);
            }
          }

          const entryId = crypto.randomUUID();
          await tx.insert(eventEntries).values({
            id: entryId,
            eventId: eventId,
            entryNumber: entry.entry_number,
            entryStartAt: entryStartAt ? entryStartAt.toISOString() : null,
            entryStartPublicAt: fromDateTimeLocal(entry.entry_start_public_at) ? fromDateTimeLocal(entry.entry_start_public_at)!.toISOString() : null,
            entryDeadlineAt: fromDateTimeLocal(entry.entry_deadline_at) ? fromDateTimeLocal(entry.entry_deadline_at)!.toISOString() : null,
            paymentDueType: entry.payment_due_type || "ABSOLUTE",
            paymentDueAt: entry.payment_due_type === "ABSOLUTE" && fromDateTimeLocal(entry.payment_due_at)
              ? fromDateTimeLocal(entry.payment_due_at)!.toISOString()
              : null,
            paymentDueDaysAfterEntry: entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry
              ? entry.payment_due_days_after_entry
              : null,
            paymentDuePublicAt: fromDateTimeLocal(entry.payment_due_public_at)
              ? fromDateTimeLocal(entry.payment_due_public_at)!.toISOString()
              : null,
            createdAt: nowStr,
            updatedAt: nowStr,
          });
        }

        return await tx.query.events.findFirst({
          where: eq(events.id, eventId),
          with: {
            eventEntries: {
              orderBy: asc(eventEntries.entryNumber),
            },
          },
        });
      });
    }

    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    if (createdEvent) {
      revalidateTag(`event-${createdEvent.id}`, {});
    }

    if (
      createdEvent &&
      createdEvent.approvalStatus === "PENDING"
    ) {
      await notifyDiscordEventApprovalRequested({
        eventId: createdEvent.id,
        eventName: createdEvent.name,
        eventDateLabel: new Date(createdEvent.eventDate).toLocaleDateString("ja-JP", {
          timeZone: "Asia/Tokyo",
        }),
      });
    }

    if (
      createdEvent &&
      createdEvent.approvalStatus === "APPROVED"
    ) {
      scheduleMergeApprovedEventIntoSitemapOnS3(
        createdEvent.id,
        new Date(createdEvent.updatedAt),
      );
    }

    // レスポンス整形
    const resObj = createdEvent ? {
      id: createdEvent.id,
      name: createdEvent.name,
      description: createdEvent.description,
      event_date: new Date(createdEvent.eventDate).toISOString(),
      event_end_date: createdEvent.eventEndDate ? new Date(createdEvent.eventEndDate).toISOString() : null,
      is_multi_day: createdEvent.isMultiDay,
      postal_code: createdEvent.postalCode,
      prefecture: createdEvent.prefecture,
      city: createdEvent.city,
      street_address: createdEvent.streetAddress,
      venue_name: createdEvent.venueName,
      keywords: keywords,
      official_urls: body.official_urls || [],
      image_url: createdEvent.imageUrl,
      approval_status: createdEvent.approvalStatus,
      updated_at: new Date(createdEvent.updatedAt).toISOString(),
      entry_selection_method: createdEvent.entrySelectionMethod,
      max_participants: createdEvent.maxParticipants,
      entries: (createdEvent.eventEntries || []).map((e: any) => ({
        entry_number: e.entryNumber,
        entry_start_at: e.entryStartAt ? new Date(e.entryStartAt).toISOString() : null,
        entry_start_public_at: e.entryStartPublicAt ? new Date(e.entryStartPublicAt).toISOString() : null,
        entry_deadline_at: e.entryDeadlineAt ? new Date(e.entryDeadlineAt).toISOString() : null,
        payment_due_type: e.paymentDueType,
        payment_due_at: e.paymentDueAt ? new Date(e.paymentDueAt).toISOString() : null,
        payment_due_days_after_entry: e.paymentDueDaysAfterEntry,
        payment_due_public_at: e.paymentDuePublicAt ? new Date(e.paymentDuePublicAt).toISOString() : null,
      })),
    } : null;

    return NextResponse.json(resObj);
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
