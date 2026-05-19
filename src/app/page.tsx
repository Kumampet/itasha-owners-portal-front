import Image from "next/image";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SiteHeader } from "@/components/site-header";
import { createMetadataWithOGP } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { buildApprovedFutureEventWhere } from "@/lib/approved-public-events";
import { HomeTopEventColumns } from "@/components/home/home-top-event-columns";
import { ServiceOverviewSection } from "@/components/service-overview-section";
import type { HomeEventBrief } from "@/components/home/home-top-event-columns";

export const revalidate = 60;

export const metadata = createMetadataWithOGP({
  title: "痛車オーナーズナビ | いたなび！",
  description:
    "無料で使える痛車オーナーのポータルサイト。イベント情報や団体管理、自分だけのリマインダー、全国イベントの無料掲載、静かなコミュニティ、主催者向け機能をご用意しています。",
});

function toBrief(
  row: {
    id: string;
    name: string;
    description: string;
    event_date: Date;
    event_end_date: Date | null;
    is_multi_day: boolean;
    image_url: string | null;
  },
): HomeEventBrief {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    event_date: row.event_date.toISOString(),
    event_end_date: row.event_end_date
      ? row.event_end_date.toISOString()
      : null,
    is_multi_day: row.is_multi_day,
    image_url: row.image_url,
  };
}

async function fetchHomeLists() {
  const now = new Date();
  const where = buildApprovedFutureEventWhere(now);
  const select = {
    id: true,
    name: true,
    description: true,
    event_date: true,
    event_end_date: true,
    is_multi_day: true,
    image_url: true,
  } as const;

  const [recentRows, upcomingRows] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 3,
      select,
    }),
    prisma.event.findMany({
      where,
      orderBy: { event_date: "asc" },
      take: 3,
      select,
    }),
  ]);

  return {
    recent: recentRows.map(toBrief),
    upcoming: upcomingRows.map(toBrief),
  };
}

export default async function Home() {
  const { recent, upcoming } = await fetchHomeLists();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative h-[min(calc(100vw*9/16),calc(100dvh-env(safe-area-inset-top,0px)-3.5rem-1px))] w-full overflow-hidden border-b border-border bg-gradient-to-b from-accent-mint/10 via-background to-background">
          <Image
            src="/images/main_logo_v2.svg"
            alt="いたなび！痛車オーナーズナビ"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-110 drop-shadow-lg"
            priority
          />
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:gap-14 sm:pt-14">
          <div className="text-center">
            <p className="mx-auto inline-block max-w-2xl px-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl md:leading-snug">
              次はどの痛車イベントに行こう___
            </p>
          </div>

          <HomeTopEventColumns recent={recent} upcoming={upcoming} />

          <ServiceOverviewSection />
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
