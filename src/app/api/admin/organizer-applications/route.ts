import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { organizerApplications } from "@/db/schema";
import { eq, and, or, asc, desc, like } from "drizzle-orm";

// GET /api/admin/organizer-applications
// オーガナイザー申請一覧取得API
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
      andConditions.push(eq(organizerApplications.status, status));
    }
    if (search) {
      andConditions.push(
        or(
          like(organizerApplications.displayName, `%${search}%`),
          like(organizerApplications.email, `%${search}%`),
          like(organizerApplications.experience, `%${search}%`)
        )
      );
    }

    let sortCol: any = organizerApplications.createdAt;
    if (sortBy === "display_name") {
      sortCol = organizerApplications.displayName;
    } else if (sortBy === "email") {
      sortCol = organizerApplications.email;
    }

    const list = await db.query.organizerApplications.findMany({
      where: andConditions.length > 0 ? and(...andConditions) : undefined,
      orderBy: sortOrder === "asc" ? asc(sortCol) : desc(sortCol),
      with: {
        user: { // applicant
          columns: {
            email: true,
          },
        },
      },
    });

    // レスポンス整形
    const formatted = list.map((app: any) => {
      return {
        id: app.id,
        display_name: app.displayName,
        email: app.email,
        experience: app.experience,
        status: app.status,
        admin_note: app.adminNote,
        applicant: app.user ? {
          email: app.user.email,
        } : null,
        created_at: new Date(app.createdAt).toISOString(),
        updated_at: new Date(app.updatedAt).toISOString(),
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
    console.error("Error fetching organizer applications:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch organizer applications", details: errorMessage },
      { status: 500 }
    );
  }
}
