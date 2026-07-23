import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, and, or, asc, desc, like } from "drizzle-orm";

// GET /api/admin/users
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const andConditions: any[] = [];
    if (role && role !== "ALL") andConditions.push(eq(users.role, role));
    if (search) {
      andConditions.push(or(like(users.email, `%${search}%`), like(users.name, `%${search}%`)));
    }

    let sortCol: any = users.createdAt;
    if (sortBy === "email") sortCol = users.email;
    else if (sortBy === "name") sortCol = users.name;

    const list = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        displayName: users.displayName,
        role: users.role,
        isBanned: users.isBanned,
        deletedAt: users.deletedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(andConditions.length > 0 ? and(...andConditions) : undefined)
      .orderBy(sortOrder === "asc" ? asc(sortCol) : desc(sortCol));

    const formatted = list.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      display_name: u.displayName,
      role: u.role,
      is_banned: u.isBanned,
      deleted_at: u.deletedAt ? new Date(u.deletedAt).toISOString() : null,
      created_at: new Date(u.createdAt).toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch users", details: errorMessage }, { status: 500 });
  }
}
