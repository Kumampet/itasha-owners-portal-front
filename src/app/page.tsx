import Image from "next/image";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SiteHeader } from "@/components/site-header";
import { createMetadataWithOGP } from "@/lib/metadata";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { buildApprovedFutureEventWhereDrizzle } from "@/lib/approved-public-events";
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
    eventDate: string;
    eventEndDate: string | null;
    isMultiDay: boolean;
    imageUrl: string | null;
  },
): HomeEventBrief {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    event_date: new Date(row.eventDate).toISOString(),
    event_end_date: row.eventEndDate
      ? new Date(row.eventEndDate).toISOString()
      : null,
    is_multi_day: row.isMultiDay,
    image_url: row.imageUrl,
  };
}

async function fetchHomeLists() {
  const now = new Date();
  const where = buildApprovedFutureEventWhereDrizzle(now);
  const selectFields = {
    id: events.id,
    name: events.name,
    description: events.description,
    eventDate: events.eventDate,
    eventEndDate: events.eventEndDate,
    isMultiDay: events.isMultiDay,
    imageUrl: events.imageUrl,
  };

  const [recentRows, upcomingRows] = await Promise.all([
    db.select(selectFields)
      .from(events)
      .where(where)
      .orderBy(desc(events.createdAt))
      .limit(3),
    db.select(selectFields)
      .from(events)
      .where(where)
      .orderBy(asc(events.eventDate))
      .limit(3),
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
