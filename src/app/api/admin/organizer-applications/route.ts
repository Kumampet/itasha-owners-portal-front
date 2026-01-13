import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // フィルター条件を構築
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { display_name: { contains: search } },
        { email: { contains: search } },
        { experience: { contains: search } },
      ];
    }

    // ソート条件を構築
    const orderBy: Record<string, string> = {};
    if (sortBy === "display_name") {
      orderBy.display_name = sortOrder;
    } else if (sortBy === "email") {
      orderBy.email = sortOrder;
    } else {
      orderBy.created_at = sortOrder;
    }

    const applications = await prisma.organizerApplication.findMany({
      where,
      orderBy,
      select: {
        id: true,
        display_name: true,
        email: true,
        experience: true,
        status: true,
        admin_note: true,
        applicant: {
          select: {
            email: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      applications,
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching organizer applications:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { error: "Failed to fetch organizer applications", details: errorMessage },
      { status: 500 }
    );
  }
}

