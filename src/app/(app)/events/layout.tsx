import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "イベント一覧",
  description: "痛車イベントの予定を確認できます。",
});

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
