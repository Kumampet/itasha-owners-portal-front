import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "リマインダー管理",
  description: "痛車イベントのエントリー開始、締切、支払期限などの重要なタイミングをリマインダーで管理できます。",
});

export default function ReminderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
