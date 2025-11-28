"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import { ShareMenu } from "@/components/share-menu";
import { LoadingSpinner } from "@/components/loading-spinner";

type Reminder = {
  id: string;
  event: {
    id: string;
    name: string;
    theme: string | null;
    event_date: string;
    original_url: string;
  } | null;
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

export default function ReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // デフォルトは期日が近い順（昇順）
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`/api/reminders?sortOrder=${sortOrder}`);
      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data = await res.json();
      setReminders(data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // 過去のリマインダーと未来のリマインダーを分ける
  const now = new Date();
  const upcomingReminders = reminders.filter(
    (r) => new Date(r.datetime) >= now
  );
  const pastReminders = reminders.filter(
    (r) => new Date(r.datetime) < now
  );

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await fetch(`/api/reminders/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete reminder");

      // リマインダー一覧を再取得
      fetchReminders();
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      alert("リマインダーの削除に失敗しました");
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
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

        {/* ソート機能と新規作成ボタン */}
        <div className="flex items-center justify-between gap-2">
          {reminders.length > 0 ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-700 sm:text-sm">
                ソート:
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs sm:text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="asc">期日が近い順（昇順）</option>
                <option value="desc">期日が遠い順（降順）</option>
              </select>
            </div>
          ) : (
            <div></div>
          )}
          <Link
            href="/app/reminder/new"
            className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 sm:px-4"
            title="リマインダーを新規作成"
          >
            <span className="flex items-center gap-1 sm:hidden">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-lg font-light">+</span>
            </span>
            <span className="hidden sm:flex sm:items-center sm:gap-1">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-lg font-light">+</span>
              <span>新規作成</span>
            </span>
          </Link>
        </div>

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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                          {reminder.event ? (
                            <>
                              <Link
                                href={`/events/${reminder.event.id}`}
                                className="mt-2 block text-sm font-semibold text-zinc-900 hover:text-emerald-600 sm:text-base"
                              >
                                {reminder.event.name}
                              </Link>
                              {reminder.event.theme && (
                                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                                  {reminder.event.theme}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-zinc-900 sm:text-base">
                              （イベント未設定）
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                            <span className="font-medium">
                              {formatDateTime(reminder.datetime)}
                            </span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <ShareMenu
                            reminderId={reminder.id}
                            reminderLabel={reminder.label}
                            eventName={reminder.event?.name || "（イベント未設定）"}
                            eventId={reminder.event?.id || ""}
                            onDeleteClick={() => handleDeleteClick(reminder.id)}
                          />
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                          {reminder.event ? (
                            <>
                              <Link
                                href={`/events/${reminder.event.id}`}
                                className="mt-2 block text-sm font-semibold text-zinc-900 hover:text-emerald-600 sm:text-base"
                              >
                                {reminder.event.name}
                              </Link>
                              {reminder.event.theme && (
                                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                                  {reminder.event.theme}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-zinc-900 sm:text-base">
                              （イベント未設定）
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                            <span className="font-medium">
                              {formatDateTime(reminder.datetime)}
                            </span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <ShareMenu
                            reminderId={reminder.id}
                            reminderLabel={reminder.label}
                            eventName={reminder.event?.name || "（イベント未設定）"}
                            eventId={reminder.event?.id || ""}
                            onDeleteClick={() => handleDeleteClick(reminder.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 削除確認モーダル */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="リマインダーを削除"
          message="本当にこのリマインダーを削除しますか？\n削除すると元に戻せません。"
          confirmLabel="削除"
          cancelLabel="キャンセル"
        />
          </>
        )}
      </section>
    </main>
  );
}

