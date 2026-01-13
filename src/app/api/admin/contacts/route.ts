import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/contacts
// 管理画面用のお問い合わせ一覧取得API（ソート・絞り込み対応）
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
        { title: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // ソート条件を構築
    const orderBy: Record<string, string> = {};
    if (sortBy === "title") {
      orderBy.title = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else {
      orderBy.created_at = sortOrder;
    }

    const contacts = await prisma.contactSubmission.findMany({
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        name: true,
        email: true,
        content: true,
        status: true,
        admin_note: true,
        submitter: {
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
      contacts,
      {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

