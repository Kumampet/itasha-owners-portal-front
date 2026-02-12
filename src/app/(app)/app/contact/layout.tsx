import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "お問い合わせ",
  description: "痛車オーナーズナビに関するお問い合わせ、ご意見、ご要望をお気軽にお寄せください。",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
