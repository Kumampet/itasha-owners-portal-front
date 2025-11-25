import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/events/[id]/reject
// イベント却下API
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

    const event = await prisma.event.update({
      where: { id },
      data: { approval_status: "REJECTED" },
    });

    // キャッシュを無効化
    const { revalidateTag } = await import("next/cache");
    revalidateTag("events");

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error rejecting event:", error);
    return NextResponse.json(
      { error: "Failed to reject event" },
      { status: 500 }
    );
  }
}

