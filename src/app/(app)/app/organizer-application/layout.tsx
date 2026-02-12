import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "オーガナイザー登録申請",
  description: "イベント主催者（オーガナイザー）として登録申請できます。イベントの公開管理などの機能が利用可能になります。",
});

export default function OrganizerApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
