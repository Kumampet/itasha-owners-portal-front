import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { groups, groupMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// DELETE /api/admin/groups/[id]/messages/[messageId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, messageId } = await params;

    const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const message = await db.query.groupMessages.findFirst({
      where: eq(groupMessages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.groupId !== id) {
      return NextResponse.json({ error: "Message does not belong to this group" }, { status: 400 });
    }

    await db.delete(groupMessages).where(eq(groupMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
