import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/db/schema";
import { eq, and, or, asc, desc, like } from "drizzle-orm";

// GET /api/admin/contacts
// 管理画面用のお問い合わせ一覧取得API
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");

    const andConditions: any[] = [];
    if (status && status !== "ALL") {
      andConditions.push(eq(contactSubmissions.status, status));
    }
    if (search) {
      andConditions.push(
        or(
          like(contactSubmissions.title, `%${search}%`),
          like(contactSubmissions.name, `%${search}%`),
          like(contactSubmissions.email, `%${search}%`),
          like(contactSubmissions.content, `%${search}%`)
        )
      );
    }

    let sortCol: any = contactSubmissions.createdAt;
    if (sortBy === "title") sortCol = contactSubmissions.title;
    else if (sortBy === "name") sortCol = contactSubmissions.name;

    const list = await db.query.contactSubmissions.findMany({
      where: andConditions.length > 0 ? and(...andConditions) : undefined,
      orderBy: sortOrder === "asc" ? asc(sortCol) : desc(sortCol),
      with: {
        user: {
          columns: { email: true },
        },
      },
    });

    const formatted = list.map((c: any) => ({
      id: c.id,
      title: c.title,
      name: c.name,
      email: c.email,
      content: c.content,
      status: c.status,
      admin_note: c.adminNote,
      submitter: c.user ? { email: c.user.email } : null,
      created_at: new Date(c.createdAt).toISOString(),
      updated_at: new Date(c.updatedAt).toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
