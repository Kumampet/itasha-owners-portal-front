"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

type DbEvent = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  event_date: string;
  entry_start_at: string | null;
  payment_due_at: string | null;
  original_url: string;
  approval_status: string;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(dateString));
}

function formatDateShort(dateString: string | null) {
  if (!dateString) return "未定";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export default function EventsPage() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <p className="text-sm text-zinc-600">読み込み中...</p>
        </section>
      </main>
    );
  }

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
          {events.length === 0 ? (
            <p className="text-sm text-zinc-600">
              イベントが登録されていません。
            </p>
          ) : (
            events.map((event) => (
              <article
                key={event.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4 ring-offset-white transition hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {formatDate(event.event_date)}
                    </p>
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {event.name}
                      </h2>
                      {event.theme && (
                        <p className="text-sm text-zinc-600">{event.theme}</p>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-zinc-700">{event.description}</p>
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
                  </div>
                  <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:w-48">
                    {event.entry_start_at && (
                      <div>
                        エントリー開始:{" "}
                        <span className="font-semibold text-zinc-700">
                          {formatDateShort(event.entry_start_at)}
                        </span>
                      </div>
                    )}
                    {event.payment_due_at && (
                      <div>
                        支払期限:{" "}
                        <span className="font-semibold text-zinc-700">
                          {formatDateShort(event.payment_due_at)}
                        </span>
                      </div>
                    )}
                    <div className="flex w-full flex-col gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        詳細
                      </Link>
                      <AuthButton
                        eventId={event.id}
                        className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        気になる
                      </AuthButton>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

