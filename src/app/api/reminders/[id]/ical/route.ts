import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            theme: true,
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
    if (reminder.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const reminderData = reminder.reminder_data as {
      type: string;
      datetime: string;
      label: string;
      event_id: string;
      event_name: string;
    };

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

    const summary = escapeICalText(`${reminderData.label} - ${reminder.event.name}`);
    
    // 説明文を構築（備考がある場合は含める）
    const descriptionParts = [reminder.event.name];
    if (reminder.event.theme) {
      descriptionParts.push(reminder.event.theme);
    }
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
    const fileName = `${reminder.event.name}_${reminderData.label}.ics`
      .replace(/[^\w\s-]/g, "_")
      .replace(/\s+/g, "_");

    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
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

