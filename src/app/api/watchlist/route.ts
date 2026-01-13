import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/watchlist
// ユーザーのウォッチリスト一覧を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const watchlist = await prisma.eventFollow.findMany({
      where: {
        user_id: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            event_date: true,
            event_end_date: true,
            is_multi_day: true,
            keywords: true,
            official_urls: true,
            image_url: true,
            approval_status: true,
            entries: {
              select: {
                entry_number: true,
                entry_start_at: true,
                entry_start_public_at: true,
                entry_deadline_at: true,
                payment_due_at: true,
                payment_due_public_at: true,
              },
              orderBy: {
                entry_number: "asc",
              },
            },
            tags: {
              select: {
                tag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        followed_at: "desc",
      },
    });

    // ユーザー固有データのため、privateディレクティブを使用して5秒間キャッシュ
    return NextResponse.json(
      watchlist,
      {
        headers: {
          "Cache-Control": "private, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

