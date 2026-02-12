import { createMetadataWithOGP } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";

type GroupDetailLayoutProps = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({
  params,
}: GroupDetailLayoutProps) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    select: {
      name: true,
      theme: true,
      event: {
        select: {
          name: true,
          image_url: true,
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
    description: `${group.event.name}に参加する団体「${group.name}」の詳細ページです。`,
    imageUrl: group.event.image_url || undefined,
  });
}

export default function GroupDetailLayout({
  children,
}: GroupDetailLayoutProps) {
  return <>{children}</>;
}
