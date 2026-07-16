export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/admin/contacts/[id]
// お問い合わせのステータスとメモを更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, admin_note } = body;

    if (status && !["PENDING", "PROCESSING", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const setData: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (status) setData.status = status;
    if (admin_note !== undefined) setData.adminNote = admin_note;

    await db
      .update(contactSubmissions)
      .set(setData)
      .where(eq(contactSubmissions.id, id));

    const updated = await db.query.contactSubmissions.findFirst({
      where: eq(contactSubmissions.id, id),
      with: {
        user: { columns: { email: true } },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const formatted = {
      id: updated.id,
      title: updated.title,
      name: updated.name,
      email: updated.email,
      content: updated.content,
      status: updated.status,
      admin_note: updated.adminNote,
      submitter: (updated as any).user ? { email: (updated as any).user.email } : null,
      created_at: new Date(updated.createdAt).toISOString(),
      updated_at: new Date(updated.updatedAt).toISOString(),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
