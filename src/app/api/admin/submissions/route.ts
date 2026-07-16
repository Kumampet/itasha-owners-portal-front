import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventSubmissions } from "@/db/schema";
import { eq, and, or, asc, desc, like } from "drizzle-orm";

// GET /api/admin/submissions
// 管理画面用の情報提供一覧取得API
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

    const andConditions = [];
    if (status && status !== "ALL") {
      andConditions.push(eq(eventSubmissions.status, status));
    }
    if (search) {
      andConditions.push(
        or(
          like(eventSubmissions.name, `%${search}%`),
          like(eventSubmissions.theme, `%${search}%`),
          like(eventSubmissions.venueName, `%${search}%`),
          like(eventSubmissions.description, `%${search}%`)
        )
      );
    }

    let sortCol = eventSubmissions.createdAt;
    if (sortBy === "event_date") {
      sortCol = eventSubmissions.eventDate;
    } else if (sortBy === "name") {
      sortCol = eventSubmissions.name;
    }

    const list = await db.query.eventSubmissions.findMany({
      where: andConditions.length > 0 ? and(...andConditions) : undefined,
      orderBy: sortOrder === "asc" ? asc(sortCol) : desc(sortCol),
      with: {
        user: { // submitter
          columns: {
            email: true,
          },
        },
      },
    });

    // レスポンス整形
    const formatted = list.map((sub: any) => {
      return {
        id: sub.id,
        name: sub.name,
        venue_name: sub.venueName,
        theme: sub.theme,
        description: sub.description,
        original_url: sub.originalUrl,
        event_date: sub.eventDate ? new Date(sub.eventDate).toISOString() : null,
        entry_start_at: sub.entryStartAt ? new Date(sub.entryStartAt).toISOString() : null,
        payment_due_at: sub.paymentDueAt ? new Date(sub.paymentDueAt).toISOString() : null,
        status: sub.status,
        admin_note: sub.adminNote,
        submitter_email: sub.submitterEmail,
        submitter: sub.user ? {
          email: sub.user.email,
        } : null,
        created_at: new Date(sub.createdAt).toISOString(),
      };
    });

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      formatted,
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
