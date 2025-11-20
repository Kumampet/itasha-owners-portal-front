import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { mockEvents } from "@/data/events";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDateRange(date: string, entryStart: string, deadline: string) {
  const main = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(date));

  return {
    main,
    entryStart: new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
    }).format(new Date(entryStart)),
    deadline: new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
    }).format(new Date(deadline)),
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = mockEvents.find((item) => item.slug === slug);

  if (!event) {
    notFound();
  }

  const formatted = formatDateRange(
    event.date,
    event.entryStart,
    event.entryDeadline,
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
          <p className="text-sm text-zinc-600 sm:text-base">{event.description}</p>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="overflow-hidden rounded-3xl border border-zinc-200">
          <Image
            src={event.coverImage}
            alt={`${event.name}のイメージ`}
            width={1200}
            height={600}
            className="h-64 w-full object-cover sm:h-96"
            priority
          />
        </div>

        <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 sm:p-7">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              開催情報
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatted.main}
            </p>
            <p className="text-sm text-zinc-600">{event.location}</p>
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
                {event.isRegistered ? "エントリー済み" : "エントリー情報を確認"}
              </button>
              <button
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  event.isFollowed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {event.isFollowed ? "気になるに登録済み" : "気になる"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-zinc-900">イベント紹介</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            {event.summary}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href={event.officialUrl}
              className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                公式サイト
              </p>
              <p className="mt-1 break-all text-sm text-zinc-800">
                {event.officialUrl}
              </p>
            </Link>
            {event.xUrl && (
              <Link
                href={event.xUrl}
                className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  X (旧Twitter)
                </p>
                <p className="mt-1 break-all text-sm text-zinc-800">
                  {event.xUrl}
                </p>
              </Link>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}


