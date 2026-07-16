import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, organizerApplications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/admin/organizer-applications/[id]/approve
// オーガナイザー申請承認API
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

    // 申請を取得
    const application = await db.query.organizerApplications.findFirst({
      where: eq(organizerApplications.id, id),
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application is not pending" },
        { status: 400 }
      );
    }

    // 既存ユーザーを確認
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, application.email))
      .get();

    if (!existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスで登録されているユーザーが見つかりません。まず一般アプリでGoogleまたはX認証でログインしてください。" },
        { status: 400 }
      );
    }

    // 既存ユーザーの場合、権限を更新
    if (existingUser.role === "ORGANIZER" || existingUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "このメールアドレスは既にオーガナイザーまたは管理者として登録されています" },
        { status: 400 }
      );
    }

    // トランザクションでユーザー権限変更と申請承認を同時に実行
    const user = await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          role: "ORGANIZER",
          displayName: application.displayName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, existingUser.id));

      await tx
        .update(organizerApplications)
        .set({
          status: "APPROVED",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(organizerApplications.id, id));

      return await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, existingUser.id))
        .get();
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error approving organizer application:", error);
    return NextResponse.json(
      { error: "Failed to approve organizer application" },
      { status: 500 }
    );
  }
}
