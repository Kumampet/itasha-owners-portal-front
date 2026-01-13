"use client";

import { ShareMenu } from "./share-menu";

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
  note: string | null;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
};

type ReminderCardProps = {
  reminder: Reminder;
  variant?: "upcoming" | "past";
  onDeleteClick: (id: string) => void;
  formatDateTime: (dateString: string) => string;
};

export function ReminderCard({
  reminder,
  variant = "upcoming",
  onDeleteClick,
  formatDateTime,
}: ReminderCardProps) {
  const isUpcoming = variant === "upcoming";

  // スタイルの違いを定義
  const cardClassName = isUpcoming
    ? "rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md sm:p-5"
    : "rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5";

  const tagClassName = isUpcoming
    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
    : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600";

  const dateTimeClassName = isUpcoming
    ? "mt-2 text-xs text-zinc-600 sm:text-sm"
    : "mt-2 text-xs text-zinc-500 sm:text-sm";

  return (
    <div key={reminder.id} className={cardClassName}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {reminder.event && (
              <span className={tagClassName}>{reminder.event.name}</span>
            )}
            {reminder.notified && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                通知済み
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-900 sm:text-base">
            {reminder.label}
          </p>
          {reminder.event?.theme && (
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              {reminder.event.theme}
            </p>
          )}
          <p className={dateTimeClassName}>
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
            hasEvent={!!reminder.event}
            datetime={reminder.datetime}
            note={reminder.note}
            onDeleteClick={() => onDeleteClick(reminder.id)}
          />
        </div>
      </div>
    </div>
  );
}

