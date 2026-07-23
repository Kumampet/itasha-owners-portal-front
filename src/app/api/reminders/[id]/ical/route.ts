import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/reminders/[id]/ical
// リマインダーをiCal形式で出力
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const reminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
      with: {
        event: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // 自分のリマインダーか確認
    if (reminder.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    let reminderData: any = {};
    try {
      if (typeof reminder.reminderData === "string") {
        reminderData = JSON.parse(reminder.reminderData);
      } else {
        reminderData = reminder.reminderData;
      }
    } catch {}

    const startDate = new Date(reminderData.datetime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1時間後

    // iCal形式の日時フォーマット（UTC）
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    // iCal形式のテキストエスケープ関数
    const escapeICalText = (text: string) => {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");
    };

    // eventがnullの場合はevent_nameを使用
    const eventName = reminder.event?.name || reminderData.event_name || "イベント";
    
    const summary = escapeICalText(`${reminderData.label} - ${eventName}`);
    
    // 説明文を構築（備考がある場合は含める）
    const descriptionParts = [eventName];
    descriptionParts.push(reminderData.label);
    if (reminder.note) {
      descriptionParts.push(`\\n備考: ${reminder.note}`);
    }
    const description = escapeICalText(descriptionParts.join("\\n"));

    // iCal形式のファイルを生成
    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Itasha Owners Portal//Reminder//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${reminder.id}@itasha-owners-portal`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // ファイル名をエンコード
    const fileName = `${eventName}_${reminderData.label}.ics`
      .replace(/[^\w\s-]/g, "_")
      .replace(/\s+/g, "_");

    // ユーザー固有データのため、privateディレクティブを使用して30秒間キャッシュ
    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error generating ical:", error);
    return NextResponse.json(
      { error: "Failed to generate ical" },
      { status: 500 }
    );
  }
}
