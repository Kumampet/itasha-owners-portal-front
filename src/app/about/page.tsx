import Link from "next/link";
import { AboutDetailParagraph } from "@/app/about/about-detail-paragraph";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SiteHeader } from "@/components/site-header";
import { SERVICE_OVERVIEW_ITEMS } from "@/content/service-overview";
import { createMetadataWithOGP } from "@/lib/metadata";

export const metadata = createMetadataWithOGP({
  title: "サービス概要 | いたなび！",
  description:
    "無料で使える痛車オーナーのポータル、イベント情報の掲載、静かなコミュニティ設計、主催者向け機能についてご紹介します。",
});

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16 pt-10 sm:pt-14">
        <div className="mx-auto max-w-5xl px-4">

          <header className="mb-12 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              サービス概要
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              いたなび！が痛車オーナーのみなさまに提供している価値を、要点ごとにご説明します。
            </p>
          </header>

          <div className="flex flex-col gap-16 sm:gap-20">
            {SERVICE_OVERVIEW_ITEMS.map((item) => (
              <section
                key={item.id}
                id={item.id}
                className="scroll-mt-28 border-t border-border pt-12 first:border-t-0 first:pt-0 sm:scroll-mt-32"
              >
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {item.title}
                </h2>
                <div className="mt-5 space-y-4">
                  {item.detailParagraphs.map((paragraph, index) => (
                    <AboutDetailParagraph
                      key={`${item.id}-${index}`}
                      html={paragraph}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-14 text-center text-sm">
            <Link
              href="/"
              className="font-medium text-accent-mint underline-offset-2 hover:underline"
            >
              ← トップへ戻る
            </Link>
          </p>
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
