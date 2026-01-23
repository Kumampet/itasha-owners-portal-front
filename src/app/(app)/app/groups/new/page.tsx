"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NewGroupEventsListPanel } from "../_components/new-group-events-list-panel";
import { NewGroupCreateForm } from "../_components/new-group-create-form";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  event_date: string;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

function NewGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
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
      setSelectedEvent(null); // イベント選択画面に戻ったら選択をクリア
    } else {
      // eventIdが変更された場合は選択をリセットしてから取得
      setSelectedEvent(null);
      fetchEvent(eventId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentPage]);

  // eventIdが変更されたときにページを1にリセット
  useEffect(() => {
    if (!eventId) {
      setCurrentPage(1);
    }
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    setEventLoading(true);
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      const eventData = await res.json();
      // APIレスポンスから必要な情報を抽出
      setSelectedEvent({
        id: eventData.id,
        name: eventData.name,
        theme: eventData.keywords?.[0] || null, // keywordsの最初の要素をthemeとして使用
        event_date: eventData.event_date,
      });
    } catch (error) {
      console.error("Failed to fetch event:", error);
      setError("イベントの取得に失敗しました");
    } finally {
      setEventLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      params.append("sortOrder", "asc");

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.events || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("イベントの取得に失敗しました");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleEventSelect = (eventId: string, event: Event) => {
    setSelectedEventId(eventId);
    setSelectedEvent(event); // 選択したイベント情報を保持
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
              あなたが団体オーナーとなり、イベントに紐づく団体を新規作成します。
            </p>
          </div>
        </header>

        {!eventId ? (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              イベントを選択してください
            </h2>
            <NewGroupEventsListPanel
              events={events}
              eventsLoading={eventsLoading}
              pagination={pagination}
              onEventSelect={handleEventSelect}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          <NewGroupCreateForm
            error={error}
            eventLoading={eventLoading}
            selectedEvent={selectedEvent}
            formData={formData}
            onFormDataChange={setFormData}
            saving={saving}
            onSubmit={handleSubmit}
          />
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

