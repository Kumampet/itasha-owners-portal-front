"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Reminder = {
  id: string;
  event: {
    id: string;
    name: string;
    theme: string | null;
    event_date: string;
    original_url: string;
  };
  type: string;
  datetime: string;
  label: string;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
};

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export default function ReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch("/api/reminders");
        if (!res.ok) throw new Error("Failed to fetch reminders");
        const data = await res.json();
        setReminders(data);
      } catch (error) {
        console.error("Failed to fetch reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  // 日付でソート（近い日付順）
  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = new Date(a.datetime).getTime();
    const dateB = new Date(b.datetime).getTime();
    return dateA - dateB;
  });

  // 過去のリマインダーと未来のリマインダーを分ける
  const now = new Date();
  const upcomingReminders = sortedReminders.filter(
    (r) => new Date(r.datetime) >= now
  );
  const pastReminders = sortedReminders.filter(
    (r) => new Date(r.datetime) < now
  );

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

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              リマインダー
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              エントリー開始日・締切・支払期限・集合時間など、イベントごとの重要な
              タイミングをまとめて管理する画面です。
            </p>
          </div>
        </header>

        {reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 sm:p-6">
            <p className="text-xs text-zinc-700 sm:text-sm">
              リマインダーが登録されていません。
              ウォッチリストにイベントを追加すると、自動的にリマインダーが設定されます。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingReminders.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-zinc-900 sm:text-base">
                  今後のリマインダー
                </h2>
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md sm:p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {reminder.label}
                            </span>
                            {reminder.notified && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                通知済み
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-zinc-900 sm:text-base">
                            {reminder.event.name}
                          </h3>
                          {reminder.event.theme && (
                            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                              {reminder.event.theme}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                            <span className="font-medium">
                              {formatDateTime(reminder.datetime)}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <Link
                            href={`/events/${reminder.event.id}`}
                            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 sm:text-sm"
                          >
                            イベント詳細
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastReminders.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-zinc-900 sm:text-base">
                  過去のリマインダー
                </h2>
                <div className="space-y-3">
                  {pastReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                              {reminder.label}
                            </span>
                            {reminder.notified && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                通知済み
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-zinc-900 sm:text-base">
                            {reminder.event.name}
                          </h3>
                          {reminder.event.theme && (
                            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                              {reminder.event.theme}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                            <span className="font-medium">
                              {formatDateTime(reminder.datetime)}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <Link
                            href={`/events/${reminder.event.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
                          >
                            イベント詳細
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

