import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "マイページ",
  description: "痛車イベントの予定管理・団体参加（併せ）管理に特化した、モバイルファーストの情報プラットフォーム",
});

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
