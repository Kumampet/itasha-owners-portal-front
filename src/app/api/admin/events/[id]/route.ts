import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { events, eventEntries, eventTags, tags as schemaTags } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { scheduleMergeApprovedEventIntoSitemapOnS3 } from "@/lib/events-sitemap-s3";
import { fromDateTimeLocal, fromDateLocal } from "@/lib/date-utils";
import { notifyDiscordEventApprovalRequested } from "@/lib/discord-admin-notify";
import { EVENT_DESCRIPTION_MAX_CHARS } from "@/lib/event-description";

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
    const eventForCheck = await db
      .select({
        createdByUserId: events.createdByUserId,
      })
      .from(events)
      .where(eq(events.id, id))
      .get();

    if (!eventForCheck) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分が登録したイベントのみアクセス可能
    if (session.user?.role === "ORGANIZER" && eventForCheck.createdByUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        eventEntries: {
          orderBy: asc(eventEntries.entryNumber),
        },
        eventTags: {
          with: {
            tag: {
              columns: {
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

    // レスポンス整形（keywords / officialUrls の JSON パース対応）
    let officialUrls: string[] = [];
    try {
      if (event.officialUrls) {
        officialUrls = typeof event.officialUrls === "string"
          ? JSON.parse(event.officialUrls)
          : event.officialUrls;
      }
    } catch { }

    let keywords: string[] = [];
    try {
      if (event.keywords) {
        keywords = typeof event.keywords === "string"
          ? JSON.parse(event.keywords)
          : event.keywords;
      }
    } catch { }

    const formattedEvent = {
      id: event.id,
      name: event.name,
      description: event.description,
      event_date: new Date(event.eventDate).toISOString(),
      event_end_date: event.eventEndDate ? new Date(event.eventEndDate).toISOString() : null,
      is_multi_day: event.isMultiDay,
      postal_code: event.postalCode,
      prefecture: event.prefecture,
      city: event.city,
      street_address: event.streetAddress,
      venue_name: event.venueName,
      keywords: keywords,
      official_urls: officialUrls,
      image_url: event.imageUrl,
      approval_status: event.approvalStatus,
      entry_selection_method: event.entrySelectionMethod,
      max_participants: event.maxParticipants,
      created_by_user_id: event.createdByUserId,
      entries: (event.eventEntries || []).map((e: any) => ({
        id: e.id,
        entry_number: e.entryNumber,
        entry_start_at: e.entryStartAt ? new Date(e.entryStartAt).toISOString() : null,
        entry_start_public_at: e.entryStartPublicAt ? new Date(e.entryStartPublicAt).toISOString() : null,
        entry_deadline_at: e.entryDeadlineAt ? new Date(e.entryDeadlineAt).toISOString() : null,
        payment_due_type: e.paymentDueType,
        payment_due_at: e.paymentDueAt ? new Date(e.paymentDueAt).toISOString() : null,
        payment_due_days_after_entry: e.paymentDueDaysAfterEntry,
        payment_due_public_at: e.paymentDuePublicAt ? new Date(e.paymentDuePublicAt).toISOString() : null,
      })),
      tags: (event.eventTags || []).map((t: any) => ({
        tag: {
          id: t.tag.id,
          name: t.tag.name,
        },
      })),
    };

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      formattedEvent,
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
    const userId = session.user.id;

    // イベントを取得して権限チェック
    const existingEvent = await db
      .select({
        createdByUserId: events.createdByUserId,
        approvalStatus: events.approvalStatus,
      })
      .from(events)
      .where(eq(events.id, id))
      .get();

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // オーガナイザーの場合、自分が登録したイベントのみ更新可能
    if (session.user?.role === "ORGANIZER" && existingEvent.createdByUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
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
    const tagsList: string[] = body.tags || [];
    const approvalStatus = body.approval_status || existingEvent.approvalStatus;
    const notifyApprovalRequested =
      existingEvent.approvalStatus === "DRAFT" && approvalStatus === "PENDING";

    // event_dateを変換
    const eventDate = fromDateLocal(body.event_date);
    if (!eventDate) {
      return NextResponse.json(
        { error: "開催日が無効です" },
        { status: 400 }
      );
    }

    // 下書き状態から申請に変更する場合はバリデーションを適用
    if (existingEvent.approvalStatus === "DRAFT" && approvalStatus === "PENDING") {
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
      if (!body.entries || body.entries.length === 0) {
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

    const performUpdate = async (tx: any) => {
      // 既存のタグを削除
      await tx.delete(eventTags).where(eq(eventTags.eventId, id));

      // イベントを更新
      await tx
        .update(events)
        .set({
          name: body.name,
          description: body.description || null,
          eventDate: eventDate.toISOString(),
          eventEndDate: body.event_end_date ? fromDateLocal(body.event_end_date)?.toISOString() : null,
          isMultiDay: body.is_multi_day || false,
          postalCode: body.postal_code || null,
          prefecture: body.prefecture || null,
          city: body.city || null,
          streetAddress: body.street_address || null,
          venueName: body.venue_name || null,
          keywords: body.keywords ? JSON.stringify(body.keywords) : null,
          officialUrls: body.official_urls ? JSON.stringify(body.official_urls) : "[]",
          imageUrl: body.image_url || null,
          approvalStatus: approvalStatus,
          paymentMethods: body.payment_methods ? JSON.stringify(body.payment_methods) : null,
          entrySelectionMethod: body.entry_selection_method || "FIRST_COME",
          maxParticipants: body.max_participants || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, id));

      // 既存のエントリー情報を削除
      await tx.delete(eventEntries).where(eq(eventEntries.eventId, id));

      // 新しいエントリー情報を作成
      if (body.entries && Array.isArray(body.entries)) {
        for (const entry of body.entries) {
          const entryStartAt = fromDateTimeLocal(entry.entry_start_at);

          if (entry.entry_start_at && typeof entry.entry_start_at === "string" && entry.entry_start_at.trim() !== "") {
            if (!entryStartAt) {
              throw new Error(`エントリー${entry.entry_number}の開始日時が無効です`);
            }
          }

          const entryId = crypto.randomUUID();
          await tx.insert(eventEntries).values({
            id: entryId,
            eventId: id,
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // タグを処理
      if (tagsList.length > 0) {
        for (const tagName of tagsList) {
          const tagId = crypto.randomUUID();
          // タグの存在確認・upsert
          await tx
            .insert(schemaTags)
            .values({
              id: tagId,
              name: tagName,
              usageCount: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: schemaTags.name,
              set: {
                usageCount: sql`${schemaTags.usageCount} + 1`,
                updatedAt: new Date().toISOString(),
              },
            });

          const tagRecord = await tx
            .select({ id: schemaTags.id })
            .from(schemaTags)
            .where(eq(schemaTags.name, tagName))
            .get();

          if (tagRecord) {
            await tx.insert(eventTags).values({
              eventId: id,
              tagId: tagRecord.id,
            });
          }
        }
      }

      // 更新したイベントを取得
      let txQuery = tx;
      if (tx.query) {
        txQuery = tx.query;
      } else {
        txQuery = db.query; // fallback for sequential execution if tx doesn't have query
      }
      return await txQuery.events.findFirst({
        where: eq(events.id, id),
        with: {
          eventEntries: {
            orderBy: asc(eventEntries.entryNumber),
          },
          eventTags: {
            with: {
              tag: true,
            },
          },
        },
      });
    };

    let updatedEvent;
    if (typeof (db as any).batch === "function") {
      updatedEvent = await performUpdate(db);
    } else {
      updatedEvent = await db.transaction(async (tx: any) => {
        return await performUpdate(tx);
      });
    }

    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    revalidateTag(`event-${id}`, {});

    if (
      notifyApprovalRequested &&
      updatedEvent &&
      updatedEvent.approvalStatus === "PENDING"
    ) {
      notifyDiscordEventApprovalRequested({
        eventId: updatedEvent.id,
        eventName: updatedEvent.name,
        eventDateLabel: new Date(updatedEvent.eventDate).toLocaleDateString("ja-JP", {
          timeZone: "Asia/Tokyo",
        }),
      });
    }

    const becameApproved =
      existingEvent.approvalStatus !== "APPROVED" &&
      updatedEvent &&
      updatedEvent.approvalStatus === "APPROVED";

    if (becameApproved && updatedEvent) {
      scheduleMergeApprovedEventIntoSitemapOnS3(
        id,
        new Date(updatedEvent.updatedAt),
      );
    }

    // レスポンス整形
    let updatedUrls: string[] = [];
    try {
      if (updatedEvent?.officialUrls) {
        updatedUrls = typeof updatedEvent.officialUrls === "string"
          ? JSON.parse(updatedEvent.officialUrls)
          : updatedEvent.officialUrls;
      }
    } catch { }

    let updatedKeywords: string[] = [];
    try {
      if (updatedEvent?.keywords) {
        updatedKeywords = typeof updatedEvent.keywords === "string"
          ? JSON.parse(updatedEvent.keywords)
          : updatedEvent.keywords;
      }
    } catch { }

    const resObj = updatedEvent ? {
      id: updatedEvent.id,
      name: updatedEvent.name,
      description: updatedEvent.description,
      event_date: new Date(updatedEvent.eventDate).toISOString(),
      event_end_date: updatedEvent.eventEndDate ? new Date(updatedEvent.eventEndDate).toISOString() : null,
      is_multi_day: updatedEvent.isMultiDay,
      postal_code: updatedEvent.postalCode,
      prefecture: updatedEvent.prefecture,
      city: updatedEvent.city,
      street_address: updatedEvent.streetAddress,
      venue_name: updatedEvent.venueName,
      keywords: updatedKeywords,
      official_urls: updatedUrls,
      image_url: updatedEvent.imageUrl,
      approval_status: updatedEvent.approvalStatus,
      updated_at: new Date(updatedEvent.updatedAt).toISOString(),
      created_by_user_id: updatedEvent.createdByUserId,
      entries: (updatedEvent.eventEntries || []).map((e: any) => ({
        id: e.id,
        entry_number: e.entryNumber,
        entry_start_at: e.entryStartAt ? new Date(e.entryStartAt).toISOString() : null,
        entry_start_public_at: e.entryStartPublicAt ? new Date(e.entryStartPublicAt).toISOString() : null,
        entry_deadline_at: e.entryDeadlineAt ? new Date(e.entryDeadlineAt).toISOString() : null,
        payment_due_at: e.paymentDueAt ? new Date(e.paymentDueAt).toISOString() : null,
        payment_due_public_at: e.paymentDuePublicAt ? new Date(e.paymentDuePublicAt).toISOString() : null,
      })),
      tags: (updatedEvent.eventTags || []).map((t: any) => ({
        tag: {
          id: t.tag.id,
          name: t.tag.name,
        },
      })),
    } : null;

    return NextResponse.json(resObj);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
