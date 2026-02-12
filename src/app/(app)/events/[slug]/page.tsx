import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createMetadataWithOGP } from "@/lib/metadata";
import { EventDetailActions } from "@/components/event-detail-actions";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { id: slug },
    select: { 
      name: true,
      description: true,
      image_url: true,
    },
  });

  if (!event) {
    return createMetadataWithOGP({
      title: "イベント詳細",
    });
  }

  return createMetadataWithOGP({
    title: event.name,
    description: event.description || undefined,
    imageUrl: event.image_url || undefined,
  });
}

function formatDateRange(
  date: Date,
  endDate: Date | null,
  isMultiDay: boolean
) {
  const main = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);

  const end = endDate && isMultiDay
    ? new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(endDate)
    : null;

  return {
    main: end ? `${main} 〜 ${end}` : main,
    end,
  };
}

function formatEntryInfo(entries: Array<{
  entry_number: number;
  entry_start_at: Date;
  entry_start_public_at: Date | null;
  entry_deadline_at: Date | null;
  payment_due_at: Date | null;
  payment_due_public_at: Date | null;
}>) {
  if (!entries || entries.length === 0) {
    return {
      entryStart: "未定",
      deadline: "未定",
    };
  }

  // 最初のエントリー情報を使用
  const firstEntry = entries[0];
  const now = new Date();

  // 公開日時が未来の場合は日時を非表示
  const entryStartAt = firstEntry.entry_start_public_at && new Date(firstEntry.entry_start_public_at) > now
    ? null
    : firstEntry.entry_start_at;

  const paymentDueAt = firstEntry.payment_due_public_at && new Date(firstEntry.payment_due_public_at) > now
    ? null
    : firstEntry.payment_due_at;

  return {
    entryStart: entryStartAt
      ? new Intl.DateTimeFormat("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(entryStartAt)
      : "未定",
    deadline: firstEntry.entry_deadline_at
      ? new Intl.DateTimeFormat("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(firstEntry.entry_deadline_at)
      : "未定",
    paymentDue: paymentDueAt
      ? new Intl.DateTimeFormat("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(paymentDueAt)
      : "未定",
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: {
      id: slug,
    },
    select: {
      id: true,
      name: true,
      description: true,
      event_date: true,
      event_end_date: true,
      is_multi_day: true,
      approval_status: true,
      prefecture: true,
      city: true,
      street_address: true,
      venue_name: true,
      keywords: true,
      official_urls: true,
      image_url: true,
      entry_selection_method: true,
      entries: {
        select: {
          entry_number: true,
          entry_start_at: true,
          entry_start_public_at: true,
          entry_deadline_at: true,
          payment_due_type: true,
          payment_due_at: true,
          payment_due_days_after_entry: true,
          payment_due_public_at: true,
        },
        orderBy: {
          entry_number: "asc",
        },
      },
      tags: {
        select: {
          tag: {
            select: {
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
    event.event_date,
    event.event_end_date,
    event.is_multi_day,
  );
  const entryInfo = formatEntryInfo(event.entries || []);

  return (
    <main className="flex-1 px-4 pb-20 pt-6 sm:pb-16 sm:pt-10">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <header className="space-y-3">
          <Link
            href="/events"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← イベント一覧に戻る
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {event.name}
          </h1>
          {event.image_url && (
            <div className="relative w-full" style={{ maxHeight: "400px" }}>
              <Image
                src={event.image_url}
                alt={event.name}
                width={1200}
                height={400}
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: "400px" }}
                unoptimized
              />
            </div>
          )}
          {event.description && (
            <p className="text-sm text-zinc-600 sm:text-base">{event.description}</p>
          )}
          {event.keywords && Array.isArray(event.keywords) && event.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(event.keywords as string[]).map((keyword: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((eventTag: { tag: { name: string } }, idx: number) => (
                <span
                  key={idx}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  {eventTag.tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 sm:p-7">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              開催情報
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatted.main}
            </p>
            {event.prefecture && (
              <p className="text-sm text-zinc-600">
                開催地: {event.prefecture}
                {event.city && ` ${event.city}`}
                {event.street_address && ` ${event.street_address}`}
              </p>
            )}
            {event.venue_name && (
              <p className="text-sm text-zinc-600">
                会場: {event.venue_name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              エントリー{event.entry_selection_method === "FIRST_COME" ? "（先着）" : event.entry_selection_method === "LOTTERY" ? "（抽選）" : event.entry_selection_method === "SELECTION" ? "（選考）" : ""}
            </p>
            <p className="text-sm text-zinc-700">
              開始: {entryInfo.entryStart} / 締切: {entryInfo.deadline}
            </p>
            {entryInfo.paymentDue !== "未定" && (
              <p className="text-sm text-zinc-700">
                支払期限: {entryInfo.paymentDue}
              </p>
            )}
            <EventDetailActions 
              eventId={event.id} 
              officialUrls={event.official_urls as string[] | undefined}
            />
          </div>
        </section>

        {event.description && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-zinc-900">イベント紹介</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {event.venue_name && (
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  会場
                </p>
                <p className="mt-1 text-sm text-zinc-800">
                  {event.venue_name}
                </p>
              </div>
            )}
            {event.prefecture && (
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  開催地
                </p>
                <p className="mt-1 text-sm text-zinc-800">
                  {event.prefecture}
                  {event.city && ` ${event.city}`}
                  {event.street_address && ` ${event.street_address}`}
                </p>
              </div>
            )}
            {event.official_urls && Array.isArray(event.official_urls) && event.official_urls.length > 0 && (
              <div className="space-y-2">
                {(event.official_urls as string[]).map((url: string, idx: number) => (
                  <Link
                    key={idx}
                    href={url}
                    className="block rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      公式サイト{(event.official_urls as string[]).length > 1 ? ` ${idx + 1}` : ""}
                    </p>
                    <p className="mt-1 break-all text-sm text-zinc-800">
                      {url}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}

