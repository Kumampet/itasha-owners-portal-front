"use client";

import { useEffect, useState } from "react";
import { LinkCard } from "@/components/link-card";
import { EventsCardContent } from "@/components/events-card-content";
import { LoadingSpinner } from "@/components/loading-spinner";

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

  return (
    <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            イベントカレンダー
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            痛車イベントをまとめてチェック
          </h1>
          <p className="text-sm text-zinc-600 sm:text-base">
            気になるイベントを一気にチェック！<br />ウォッチリストに入れておくと最新情報を逃しません。
          </p>
        </header>

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-zinc-600">
              イベントが登録されていません。
            </p>
          ) : (
            events.map((event) => (
              <LinkCard
                key={event.id}
                href={`/events/${event.id}`}
                className="hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                cardClassName="rounded-3xl"
              >
                <EventsCardContent event={event} />
              </LinkCard>
            ))
          )}
        </div>
          </>
        )}
      </section>
    </main>
  );
}

