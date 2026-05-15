"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

type Event = {
  id: string;
  name: string;
  theme: string | null;
};

type Reminder = {
  id: string;
  event: {
    id: string;
    name: string;
    theme: string | null;
  } | null;
  label: string;
  datetime: string;
  note?: string | null;
};

export default function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [events, setEvents] = useState<Event[]>([]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    event_id: "",
    label: "",
    datetime: "",
    note: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // イベント一覧を取得
        const eventsRes = await fetch("/api/events");
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

        // リマインダー情報を取得
        const reminderRes = await fetch(`/api/reminders/${id}`);
        if (!reminderRes.ok) throw new Error("Failed to fetch reminder");
        const reminderData = await reminderRes.json();
        setReminder(reminderData);

        // datetime-local形式に変換（ISO形式から）
        const datetimeValue = new Date(reminderData.datetime);
        const localDateTime = new Date(datetimeValue.getTime() - datetimeValue.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        setFormData({
          event_id: reminderData.event?.id || "",
          label: reminderData.label,
          datetime: localDateTime,
          note: reminderData.note || "",
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        alert("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // datetime-local形式をISO形式に変換
      const datetimeISO = new Date(formData.datetime).toISOString();

      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          datetime: datetimeISO,
        }),
      });

      if (!res.ok) throw new Error("Failed to update reminder");

      router.push("/app/reminder");
    } catch (error) {
      console.error("Failed to update reminder:", error);
      alert("リマインダーの更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete reminder");

      router.push("/app/reminder");
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      alert("リマインダーの削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </section>
      </main>
    );
  }

  if (!reminder) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <p className="text-sm text-zinc-600">リマインダーが見つかりません</p>
          <Link
            href="/app/reminder"
            className="text-sm text-emerald-600 hover:underline"
          >
            ← リマインダー一覧に戻る
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/reminder"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← リマインダー一覧に戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              リマインダーを編集
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              リマインダーの情報を編集します。
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              イベント
            </label>
            <select
              value={formData.event_id}
              onChange={(e) =>
                setFormData({ ...formData, event_id: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="">選択してください（任意）</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.theme && ` - ${event.theme}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              ラベル *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: エントリー開始、支払期限、集合時間"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              日時 *
            </label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) =>
                setFormData({ ...formData, datetime: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              備考
            </label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              rows={4}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="リマインダーに関するメモや備考を入力してください（任意）"
            />
          </div>

          <div className="flex gap-2 justify-between">
            <Button
              variant="danger"
              size="sm"
              rounded="md"
              onClick={handleDeleteClick}
              className="border-red-300 bg-white text-red-700 hover:bg-red-50"
              title="削除"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>削除</span>
            </Button>
            <div className="flex gap-2">
              <Button
                as="link"
                href="/app/reminder"
                variant="secondary"
                size="md"
                rounded="md"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                rounded="md"
                disabled={saving}
              >
                {saving ? "更新中..." : "更新"}
              </Button>
            </div>
          </div>
        </form>

        {/* 削除確認モーダル */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="リマインダーを削除"
          message="本当にこのリマインダーを削除しますか？削除すると元に戻せません。"
          confirmLabel="削除"
          cancelLabel="キャンセル"
        />
      </section>
    </main>
  );
}

