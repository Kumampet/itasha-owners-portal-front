import { createMetadataWithOGP } from "@/lib/metadata";
import { db } from "@/lib/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";

type GroupDetailLayoutProps = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({
  params,
}: GroupDetailLayoutProps) {
  const { id } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, id),
    with: {
      event: {
        columns: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!group) {
    return createMetadataWithOGP({
      title: "団体詳細",
    });
  }

  const title = group.theme
    ? `${group.name} - ${group.theme}`
    : group.name;

  return createMetadataWithOGP({
    title,
    description: `${group.event?.name || "イベント"}に参加する団体「${group.name}」の詳細ページです。`,
    imageUrl: group.event?.imageUrl || undefined,
  });
}

export default function GroupDetailLayout({
  children,
}: GroupDetailLayoutProps) {
  return <>{children}</>;
}
