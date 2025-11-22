import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDateRange(
  date: Date,
  entryStart: Date | null,
  deadline: Date | null
) {
  const main = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);

  return {
    main,
    entryStart: entryStart
      ? new Intl.DateTimeFormat("ja-JP", {
          month: "short",
          day: "numeric",
        }).format(entryStart)
      : "未定",
    deadline: deadline
      ? new Intl.DateTimeFormat("ja-JP", {
          month: "short",
          day: "numeric",
        }).format(deadline)
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
      theme: true,
      description: true,
      event_date: true,
      entry_start_at: true,
      payment_due_at: true,
      original_url: true,
      approval_status: true,
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
    event.entry_start_at,
    event.payment_due_at,
  );

  return (
    <main className="flex-1 px-4 pb-20 pt-6 sm:pb-16 sm:pt-10">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <header className="space-y-3">
          <Link
            href="/app/events"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← イベント一覧に戻る
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {event.name}
          </h1>
          {event.description && (
            <p className="text-sm text-zinc-600 sm:text-base">{event.description}</p>
          )}
          {event.tags.length > 0 && (
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
            {event.theme && (
              <p className="text-sm text-zinc-600">{event.theme}</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              エントリー
            </p>
            <p className="text-sm text-zinc-700">
              開始: {formatted.entryStart} / 締切: {formatted.deadline}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
                エントリー情報を確認
              </button>
              <button className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                気になる
              </button>
            </div>
          </div>
        </section>

        {event.description && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-zinc-900">イベント紹介</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              {event.description}
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={event.original_url}
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                公式サイト
              </p>
              <p className="mt-1 break-all text-sm text-zinc-800">
                {event.original_url}
              </p>
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}


