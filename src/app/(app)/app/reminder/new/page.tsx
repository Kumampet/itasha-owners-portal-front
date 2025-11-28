"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { shouldRedirectToNotificationSettings } from "@/lib/notification-check";
import {
  generateGoogleCalendarUrl,
  generateICalContent,
  downloadICalFile,
  isIOS,
  isAndroid,
} from "@/lib/calendar";
import { ModalBase } from "@/components/modal-base";

type Event = {
  id: string;
  name: string;
  theme: string | null;
};

export default function NewReminderPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [createdReminder, setCreatedReminder] = useState<{
    label: string;
    datetime: string;
    note: string | null;
    eventName: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    event_id: "",
    label: "",
    datetime: "",
    note: "",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 通知設定をチェック
      const shouldRedirect = await shouldRedirectToNotificationSettings();
      if (shouldRedirect) {
        const currentPath = window.location.pathname;
        router.push(`/app/notification-settings?callbackUrl=${encodeURIComponent(currentPath)}`);
        setSaving(false);
        return;
      }

      // datetime-local形式をISO形式に変換
      const datetimeISO = new Date(formData.datetime).toISOString();

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          datetime: datetimeISO,
        }),
      });

      if (!res.ok) throw new Error("Failed to create reminder");

      const reminderData = await res.json();

      // 作成したリマインダー情報を保存してカレンダー登録モーダルを表示
      const selectedEvent = events.find((e) => e.id === formData.event_id);
      setCreatedReminder({
        label: formData.label,
        datetime: formData.datetime,
        note: formData.note || null,
        eventName: selectedEvent?.name || null,
      });
      setShowCalendarModal(true);
    } catch (error) {
      console.error("Failed to create reminder:", error);
      alert("リマインダーの作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
          </div>
        </section>
      </main>
    );
  }

  const handleGoogleCalendar = () => {
    if (!createdReminder) return;

    const startDate = new Date(createdReminder.datetime);
    const title = createdReminder.eventName
      ? `${createdReminder.eventName} - ${createdReminder.label}`
      : createdReminder.label;
    const description = createdReminder.note || "";

    const url = generateGoogleCalendarUrl({
      title,
      startDate,
      description,
    });

    window.open(url, "_blank");
  };

  const handleIOSCalendar = () => {
    if (!createdReminder) return;

    const startDate = new Date(createdReminder.datetime);
    const title = createdReminder.eventName
      ? `${createdReminder.eventName} - ${createdReminder.label}`
      : createdReminder.label;
    const description = createdReminder.note || "";

    const icalContent = generateICalContent({
      title,
      startDate,
      description,
    });

    const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    downloadICalFile(icalContent, filename);
  };

  const handleSkip = () => {
    setShowCalendarModal(false);
    router.push("/app/reminder");
  };

  const handleCloseModal = () => {
    setShowCalendarModal(false);
    router.push("/app/reminder");
  };

  const iosDevice = isIOS();

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
              リマインダーを新規作成
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              イベントの重要なタイミングをリマインダーとして登録します。
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

          <div className="flex gap-2 justify-end">
            <Link
              href="/app/reminder"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "作成中..." : "作成"}
            </button>
          </div>
        </form>

        {/* カレンダー登録モーダル */}
        {createdReminder && (
          <ModalBase
            isOpen={showCalendarModal}
            onClose={handleCloseModal}
            title="カレンダーに登録"
            footer={
              <>
                <button
                  onClick={handleSkip}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  スキップ
                </button>
              </>
            }
          >
            <div className="space-y-2">
              <p className="text-sm text-zinc-600">
                リマインダーが作成されました。カレンダーアプリにも登録しますか？
              </p>

              <div className="mt-4 space-y-3">
                {/* Googleカレンダー（全デバイスで表示） */}
                <button
                  onClick={handleGoogleCalendar}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 flex items-center justify-center gap-2"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Googleカレンダーに登録
                </button>

                {/* iOSカレンダー（iOSデバイスのみ） */}
                {iosDevice && (
                  <button
                    onClick={handleIOSCalendar}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5zm7 4H7v-2h5v2zm5 0h-4v-2h4v2zm-5 4H7v-2h5v2zm5 0h-4v-2h4v2z" />
                    </svg>
                    iOSカレンダーに登録
                  </button>
                )}
              </div>
            </div>
          </ModalBase>
        )}
      </section>
    </main>
  );
}

