import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users
// 管理画面用のユーザー一覧取得API（ソート・絞り込み対応）
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
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    // フィルター条件を構築
    const where: Record<string, unknown> = {};
    if (role && role !== "ALL") {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    // ソート条件を構築
    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[sortBy] = sortOrder as "asc" | "desc";

    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        display_name: true,
        role: true,
        is_banned: true,
        deleted_at: true,
        created_at: true,
      },
    });

    // 管理画面用のため、privateディレクティブを使用して10秒間キャッシュ
    return NextResponse.json(
      users,
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", details: errorMessage },
      { status: 500 }
    );
  }
}

