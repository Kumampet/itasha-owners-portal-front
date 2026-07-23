import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createMetadataWithOGP, getMetadataBase } from "@/lib/metadata";
import { EventDetailActions } from "@/components/event-detail-actions";
import { formatShortDateTime } from "@/lib/date-utils";
import { EventPageHeader } from "./event-page-header";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db
    .select({
      name: events.name,
      description: events.description,
      imageUrl: events.imageUrl,
    })
    .from(events)
    .where(eq(events.id, slug))
    .get();

  if (!event) {
    return createMetadataWithOGP({
      title: "イベント詳細",
    });
  }

  const trimmedImage = event.imageUrl?.trim();

  return createMetadataWithOGP({
    title: event.name,
    description: event.description || undefined,
    imageUrl: trimmedImage || undefined,
    ...(trimmedImage ? { twitterCard: "summary_large_image" as const } : {}),
  });
}

/** DB は UTC 保存のため、表示は JST にそろえる */
const DISPLAY_TZ = "Asia/Tokyo";

function formatDateRange(
  date: Date,
  endDate: Date | null,
  isMultiDay: boolean
) {
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: DISPLAY_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };

  const main = new Intl.DateTimeFormat("ja-JP", dateOptions).format(date);

  const end = endDate && isMultiDay
    ? new Intl.DateTimeFormat("ja-JP", dateOptions).format(endDate)
    : null;

  return {
    main: end ? `${main} 〜 ${end}` : main,
    end,
  };
}

function formatEntryInfo(entries: Array<{
  entryNumber: number;
  entryStartAt: string | null;
  entryStartPublicAt: string | null;
  entryDeadlineAt: string | null;
  paymentDueAt: string | null;
  paymentDuePublicAt: string | null;
}>) {
  if (!entries || entries.length === 0) {
    return {
      entryStart: "未定",
      deadline: "未定",
      paymentDue: "未定",
    };
  }

  const firstEntry = entries[0];
  const now = new Date();

  // 公開日時が未来の場合は日時を非表示
  const entryStartAt = firstEntry.entryStartPublicAt && new Date(firstEntry.entryStartPublicAt) > now
    ? null
    : firstEntry.entryStartAt;

  const paymentDueAt = firstEntry.paymentDuePublicAt && new Date(firstEntry.paymentDuePublicAt) > now
    ? null
    : firstEntry.paymentDueAt;

  return {
    entryStart: entryStartAt
      ? formatShortDateTime(new Date(entryStartAt))
      : "未定",
    deadline: firstEntry.entryDeadlineAt
      ? formatShortDateTime(new Date(firstEntry.entryDeadlineAt))
      : "未定",
    paymentDue: paymentDueAt
      ? formatShortDateTime(new Date(paymentDueAt))
      : "未定",
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, slug),
    with: {
      eventEntries: {
        orderBy: asc(eventEntries => eventEntries.entryNumber),
      },
      eventTags: {
        with: {
          tag: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const formatted = formatDateRange(
    new Date(event.eventDate),
    event.eventEndDate ? new Date(event.eventEndDate) : null,
    event.isMultiDay || false,
  );

  const formattedEntries = (event.eventEntries || []).map((e: any) => ({
    entryNumber: e.entryNumber,
    entryStartAt: e.entryStartAt,
    entryStartPublicAt: e.entryStartPublicAt,
    entryDeadlineAt: e.entryDeadlineAt,
    paymentDueAt: e.paymentDueAt,
    paymentDuePublicAt: e.paymentDuePublicAt,
  }));

  const entryInfo = formatEntryInfo(formattedEntries);

  let officialUrls: string[] = [];
  try {
    if (event.officialUrls) {
      officialUrls = typeof event.officialUrls === "string"
        ? JSON.parse(event.officialUrls)
        : event.officialUrls;
    }
  } catch {}

  let keywords: string[] = [];
  try {
    if (event.keywords) {
      keywords = typeof event.keywords === "string"
        ? JSON.parse(event.keywords)
        : event.keywords;
    }
  } catch {}

  const hasLocationDetailSection =
    Boolean(event.venueName) ||
    Boolean(event.prefecture) ||
    (Array.isArray(officialUrls) && officialUrls.length > 0);

  const shareUrl = `${getMetadataBase().origin.replace(/\/$/, "")}/events/${event.id}`;

  return (
    <main className="flex-1 px-4 pb-20 pt-6 sm:pb-16 sm:pt-10">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <Link
          href="/events"
          className="text-xs font-semibold uppercase tracking-wide text-accent-mint"
        >
          ← イベント一覧に戻る
        </Link>

        <EventPageHeader
          name={event.name}
          image_url={event.imageUrl}
          keywords={keywords}
          tags={event.eventTags}
          shareUrl={shareUrl}
        />

        <section className="grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              開催情報
            </p>
            <p className="text-lg font-semibold text-foreground">
              開催日時: {formatted.main}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              エントリー{event.entrySelectionMethod === "FIRST_COME" ? "（先着）" : event.entrySelectionMethod === "LOTTERY" ? "（抽選）" : event.entrySelectionMethod === "SELECTION" ? "（選考）" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              開始: {entryInfo.entryStart} / 締切: {entryInfo.deadline}
            </p>
            {entryInfo.paymentDue !== "未定" && (
              <p className="text-sm text-muted-foreground">
                支払期限: {entryInfo.paymentDue}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <EventDetailActions
              eventId={event.id}
              officialUrls={officialUrls}
            />
          </div>
        </section>

        {event.description && (
          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">イベント紹介</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}

        {hasLocationDetailSection ? (
          <section className="space-y-6 border-t border-border pt-8">
            {(event.venueName || event.prefecture) ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {event.prefecture && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      開催地
                    </p>
                    <p className="text-sm text-foreground">
                      {event.prefecture}
                      {event.city && ` ${event.city}`}
                      {event.streetAddress && ` ${event.streetAddress}`}
                    </p>
                  </div>
                )}
                {event.venueName && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      会場
                    </p>
                    <p className="text-sm text-foreground">
                      {event.venueName}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
            {officialUrls && officialUrls.length > 0 && (
              <div className="space-y-3">
                {officialUrls.map((url: string, idx: number) => (
                  <div key={idx}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      公式サイト{officialUrls.length > 1 ? ` ${idx + 1}` : ""}
                    </p>
                    <Link
                      href={url}
                      className="mt-1 inline-block break-all text-sm text-accent-mint underline underline-offset-4 hover:text-accent-mint/90"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {url}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </article>
    </main>
  );
}
