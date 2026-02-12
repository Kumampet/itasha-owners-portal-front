import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "団体管理",
  description: "痛車イベントの団体参加（併せ）を管理できます。メンバー募集、一斉連絡、設定管理などの機能を提供します。",
});

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
