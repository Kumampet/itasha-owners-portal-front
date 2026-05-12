"use client";

import Link from "next/link";
import { Card, CardTitle, CardContent } from "@/components/card";
import { LoadingSpinner } from "@/components/loading-spinner";

export type MyPageReminder = {
  id: string;
  event: {
    id: string;
    name: string;
    event_date: Date | null;
    original_url: string | null;
  } | null;
  type: string;
  datetime: string;
  label: string;
  note: string | null;
  notified: boolean;
  notified_at: Date | null;
  created_at: Date;
};

function formatReminderDateTime(dateString: string) {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${month}/${day} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

type MyPageReminderPanelProps = {
  isLoadingReminders: boolean;
  reminders: MyPageReminder[];
};

export function MyPageReminderPanel({
  isLoadingReminders,
  reminders,
}: MyPageReminderPanelProps) {
  return (
    <Card>
      <CardTitle>近日中のリマインダー</CardTitle>
      <CardContent>
        {isLoadingReminders ? (
          <div className="mt-3 flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-muted">読み込み中...</span>
          </div>
        ) : reminders.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            直近3日間（72時間）以内のリマインダーはありません。イベントをフォローすると、ここに
            エントリー開始・締切・集合時間などが表示されます。
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground sm:text-sm">
                      {reminder.label}
                    </p>
                    {reminder.event && (
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        {reminder.event.name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {formatReminderDateTime(reminder.datetime)}
                    </p>
                  </div>
                  {reminder.event && (
                    <Link
                      href={`/events/${reminder.event.id}`}
                      className="ml-2 whitespace-nowrap text-xs font-semibold text-accent-mint hover:text-accent-mint"
                    >
                      詳細 →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
