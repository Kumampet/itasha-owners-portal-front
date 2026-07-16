import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/user/display-name
// 表示名を更新
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { displayName } = body;

    // displayNameがnullまたは空文字列の場合はnullに設定（任意項目のため）
    let displayNameValue: string | null = null;
    if (displayName && typeof displayName === "string" && displayName.trim()) {
      // 全角50文字以内に制限
      const charCount = Array.from(displayName.trim()).length;
      if (charCount > 50) {
        return NextResponse.json(
          { error: "Display name must be 50 characters or less" },
          { status: 400 }
        );
      }
      displayNameValue = displayName.trim();
    }

    // 表示名を更新
    await db
      .update(users)
      .set({
        displayName: displayNameValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating display name:", error);
    return NextResponse.json(
      { error: "Failed to update display name" },
      { status: 500 }
    );
  }
}
