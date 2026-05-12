import Link from "next/link";
import Image from "next/image";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SiteHeader } from "@/components/site-header";
import { createMetadataWithOGP } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { buildApprovedFutureEventWhere } from "@/lib/approved-public-events";
import { HomeTopEventColumns } from "@/components/home/home-top-event-columns";
import type { HomeEventBrief } from "@/components/home/home-top-event-columns";

export const metadata = createMetadataWithOGP({
  title: "痛車オーナーズナビ | いたなび！",
  description:
    "痛車イベントの予定管理・団体参加（併せ）管理に特化した、モバイルファーストの情報プラットフォーム。エントリー開始・締切・支払期限を自動でリマインドし、併せのメンバー募集と一斉連絡機能を提供します。",
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
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent-mint/10 via-background to-background">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-10 pt-8 sm:pb-14 sm:pt-12">
            <div className="relative aspect-[21/9] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-accent-mint/25 bg-gradient-to-br from-zinc-950 via-zinc-900 to-accent-mint-subtle shadow-xl shadow-black/40">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <div className="relative w-full max-w-md">
                  <Image
                    src="/images/main_logo.png"
                    alt="いたなび！痛車オーナーズナビ"
                    width={560}
                    height={220}
                    className="mx-auto h-auto w-full brightness-110 drop-shadow-lg"
                    priority
                  />
                </div>
                <p className="max-w-sm text-[11px] leading-relaxed text-accent-mint/80 sm:text-xs">
                  痛車イベントの「併せ」と「締切」まで、ひとつの場所で。
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:gap-14 sm:pt-14">
          <div className="text-center">
            <p className="mx-auto inline-block max-w-2xl px-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl md:leading-snug">
              次はどの痛車イベントに行こう___
            </p>
          </div>

          <HomeTopEventColumns recent={recent} upcoming={upcoming} />

          <section className="grid gap-4 rounded-3xl bg-card-elevated p-5 sm:grid-cols-2 sm:gap-6 sm:p-8">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                期限管理のストレスをゼロに
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                イベントのエントリー開始・締切・支払期限を1つのタイムラインで確認。
                重要なタイミングはメールで事前にお知らせします。
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                XのDM制限に依存しない併せ管理
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                団体チャットの一斉連絡機能で、メンバー全員に確実に情報を共有できます。
                DM制限やアカウント凍結に左右されない、安心できる連絡手段を提供します。
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                競争のない、静かな情報プラットフォーム
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                フォロー/フォロワー、いいね、ランキングといった SNS的な機能はあえて搭載しません。痛車活動を気楽に続けるための
                インフラとして設計されています。
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                イベント主催者（オーガナイザー）向け機能
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                管理者に申請することで、イベント主催者用アカウントを作成できます。
                一部の未公開のイベント情報も、公開管理を時限的に操作できます。
              </p>
            </div>
          </section>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/events"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent-mint px-8 text-sm font-semibold text-zinc-950 shadow-sm transition hover:brightness-110 sm:w-auto"
            >
              イベント一覧を見る
            </Link>
            <Link
              href="/app/auth"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-accent-rose/35 bg-accent-rose/10 px-8 text-sm font-medium text-accent-rose transition hover:bg-accent-rose/15 sm:w-auto"
            >
              ログインする
            </Link>
          </div>
        </div>
      </main>
      <PublicSiteFooter />
    </>
  );
}
