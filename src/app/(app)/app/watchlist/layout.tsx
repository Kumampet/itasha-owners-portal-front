import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "ウォッチリスト",
  description: "気になる痛車イベントをウォッチリストに追加して、重要なタイミングを見逃さないようにしましょう。",
});

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
