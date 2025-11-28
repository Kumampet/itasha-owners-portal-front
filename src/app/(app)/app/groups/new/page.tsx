"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  event_date: string;
};

function NewGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    maxMembers: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) {
      fetchEvents();
    } else {
      fetchEvent(eventId);
    }
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    setEventLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      const event = data.find((e: Event) => e.id === id);
      if (event) {
        setSelectedEvent(event);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setEventLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("イベントの取得に失敗しました");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    router.push(`/app/groups/new?eventId=${eventId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const targetEventId = eventId || selectedEventId;
    if (!targetEventId) {
      setError("イベントを選択してください");
      setSaving(false);
      return;
    }

    if (!formData.name.trim()) {
      setError("団体名は必須です");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: targetEventId,
          name: formData.name.trim(),
          theme: formData.theme.trim() || null,
          maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "団体の作成に失敗しました");
      }

      const data = await res.json();
      router.push(`/app/groups/${data.groupId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "団体の作成に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/groups"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← 団体一覧に戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              新規団体を作成
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              あなたが団体オーナーとなり、8桁の団体コードが自動で発行されます。
            </p>
          </div>
        </header>

        {!eventId ? (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              イベントを選択してください
            </h2>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : events.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                イベントが見つかりません
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <Button
                    key={event.id}
                    variant="secondary"
                    size="md"
                    rounded="md"
                    fullWidth
                    onClick={() => handleEventSelect(event.id)}
                    className="p-4 text-left justify-start hover:border-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {event.name}
                        </p>
                        {event.theme && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {event.theme}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(event.event_date).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">
                        選択 →
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
          >
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {eventLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : selectedEvent ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-500">対象イベント</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {selectedEvent.name}
                </p>
                {selectedEvent.theme && (
                  <p className="mt-1 text-xs text-zinc-600">{selectedEvent.theme}</p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(selectedEvent.event_date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            ) : null}

            <div>
            <label className="block text-sm font-medium text-zinc-700">
              団体名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
              placeholder="例: レトロスポーツ痛車会"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              テーマ（任意）
            </label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) =>
                setFormData({ ...formData, theme: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 80年代スポーツカー中心"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              最大メンバー数（任意）
            </label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={(e) =>
                setFormData({ ...formData, maxMembers: e.target.value })
              }
              min="1"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 10"
            />
            <p className="mt-1 text-xs text-zinc-500">
              指定しない場合は制限なし
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              rounded="md"
              fullWidth
              disabled={saving}
            >
              {saving ? "作成中..." : "作成する"}
            </Button>
            <Link
              href="/app/groups"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </Link>
          </div>
        </form>
        )}
      </section>
    </main>
  );
}

export default function NewGroupPage() {
  return (
    <Suspense fallback={
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </section>
      </main>
    }>
      <NewGroupForm />
    </Suspense>
  );
}

