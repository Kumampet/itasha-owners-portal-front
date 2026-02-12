import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "イベント掲載依頼",
  description: "痛車イベントの掲載を依頼できます。イベント情報を登録して、多くの痛車オーナーに情報を届けましょう。",
});

export default function EventSubmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
