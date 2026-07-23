import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, organizerApplications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyDiscordOrganizerApplication } from "@/lib/discord-admin-notify";

// POST /api/organizer-applications
// オーガナイザー登録申請API
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { display_name, email, experience } = body;

    // 必須項目のチェック
    if (!display_name || !email || !experience) {
      return NextResponse.json(
        { error: "表示名、メールアドレス、歴代の運営実績は必須です" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // セッションのユーザーIDがデータベースに存在するか確認
    let applicantId: string | null = null;
    if (session?.user?.id) {
      try {
        console.log(`[OrganizerApplication] Checking user existence for ID: ${session.user.id}`);
        const userExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, session.user.id))
          .get();

        if (userExists) {
          applicantId = session.user.id;
          console.log(`[OrganizerApplication] User found, setting applicant_id: ${applicantId}`);
        } else {
          console.warn(`[OrganizerApplication] User not found in database for ID: ${session.user.id}`);
        }
      } catch (error) {
        console.error("[OrganizerApplication] Error checking user existence:", error);
      }
    }

    const applicationId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    // 申請を作成
    await db.insert(organizerApplications).values({
      id: applicationId,
      displayName: display_name,
      email: email,
      experience: experience,
      applicantId: applicantId,
      status: "PENDING",
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    await notifyDiscordOrganizerApplication({
      id: applicationId,
      displayName: display_name,
    });

    return NextResponse.json({
      id: applicationId,
      display_name: display_name,
      email: email,
      status: "PENDING",
      created_at: nowStr,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organizer application:", error);
    return NextResponse.json(
      { error: "申請の送信に失敗しました" },
      { status: 500 }
    );
  }
}
