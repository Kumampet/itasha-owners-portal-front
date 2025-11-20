import Link from "next/link";
import { mockEvents } from "@/data/events";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(dateString));
}

export default function EventsPage() {
  const sortedEvents = [...mockEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            イベントカレンダー
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            痛車イベントをまとめてチェック
          </h1>
          <p className="text-sm text-zinc-600 sm:text-base">
            エントリー開始前に「気になる」をつけておくと、リマインダーとメール通知で
            申込チャンスを逃しません。
          </p>
        </header>

        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <article
              key={event.slug}
              className="rounded-3xl border border-zinc-200 bg-white p-4 ring-offset-white transition hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {formatDate(event.date)}
                  </p>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {event.name}
                    </h2>
                    <p className="text-sm text-zinc-600">{event.location}</p>
                  </div>
                  <p className="text-sm text-zinc-700">{event.summary}</p>
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
                </div>
                <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:w-48">
                  <div>
                    エントリー開始:{" "}
                    <span className="font-semibold text-zinc-700">
                      {event.entryStart}
                    </span>
                  </div>
                  <div>
                    締切:{" "}
                    <span className="font-semibold text-zinc-700">
                      {event.entryDeadline}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <Link
                      href={`/app/events/${event.slug}`}
                      className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      詳細
                    </Link>
                    <button
                      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                        event.isFollowed
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {event.isFollowed ? "気になる済" : "気になる"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

