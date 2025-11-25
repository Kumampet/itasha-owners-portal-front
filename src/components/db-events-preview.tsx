"use client";

import { useEffect, useState } from "react";

type EventResponse = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  original_url: string;
  event_date: string;
  entry_start_at: string | null;
  payment_due_at: string | null;
  approval_status: string;
};

export function DbEventsPreview() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      setStatus("loading");
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = (await res.json()) as EventResponse[];
        if (mounted) {
          setEvents(data);
          setStatus("idle");
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        if (mounted) setStatus("error");
      }
    }

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        データの取得に失敗しました。後ほど再度お試しください。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            DBプレビュー
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
            Prisma経由で取得したイベント
          </h2>
        </div>
        {status === "loading" && (
          <span className="text-xs text-zinc-500">読み込み中...</span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 && status === "idle" ? (
          <p className="text-sm text-zinc-600">
            イベントが登録されていません。`npm run db:seed` を実行してデータを投入してください。
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <span>
                  開催日:{" "}
                  {new Date(event.event_date).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  {event.approval_status}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold text-zinc-900">
                {event.name}
              </p>
              {event.description && (
                <p className="mt-1 text-xs text-zinc-600">{event.description}</p>
              )}
              <a
                href={event.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-600"
              >
                公式情報を見る →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


