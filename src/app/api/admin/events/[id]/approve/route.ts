import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scheduleMergeApprovedEventIntoSitemapOnS3 } from "@/lib/events-sitemap-s3";
import { notifyDiscordEventApproved } from "@/lib/discord-admin-notify";

// POST /api/admin/events/[id]/approve
// イベント承認API
export async function POST(
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
    const nowStr = new Date().toISOString();

    await db
      .update(events)
      .set({
        approvalStatus: "APPROVED",
        updatedAt: nowStr,
      })
      .where(eq(events.id, id));

    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    scheduleMergeApprovedEventIntoSitemapOnS3(event.id, new Date(event.updatedAt));

    await notifyDiscordEventApproved({
      eventId: event.id,
      eventName: event.name,
      eventDateLabel: new Date(event.eventDate).toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
      }),
    });

    // キャッシュを無効化
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events", {});
    revalidateTag(`event-${id}`, {});

    const resObj = {
      id: event.id,
      name: event.name,
      approval_status: event.approvalStatus,
      updated_at: new Date(event.updatedAt).toISOString(),
    };

    return NextResponse.json(resObj);
  } catch (error) {
    console.error("Error approving event:", error);
    return NextResponse.json(
      { error: "Failed to approve event" },
      { status: 500 }
    );
  }
}
