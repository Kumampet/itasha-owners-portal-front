"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type ShareMenuProps = {
  reminderId: string;
  reminderLabel: string;
  reminderDatetime: string;
  eventName: string;
  eventId: string;
  onDeleteClick: () => void;
};

export function ShareMenu({
  reminderId,
  reminderLabel,
  reminderDatetime,
  eventName,
  eventId,
  onDeleteClick,
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadIcal = async () => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}/ical`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", res.status, errorData);
        throw new Error(`Failed to download ical: ${res.status} ${errorData.error || "Unknown error"}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${eventName}_${reminderLabel}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to download ical:", error);
      const errorMessage = error instanceof Error ? error.message : "iCalファイルのダウンロードに失敗しました";
      alert(errorMessage);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
        title="メニュー"
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
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-zinc-200 bg-white shadow-lg">
          <div className="py-1">
            <Link
              href={`/events/${eventId}`}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>イベント詳細</span>
            </Link>
            <Link
              href={`/app/reminder/${reminderId}/edit`}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>編集</span>
            </Link>
            <button
              onClick={handleDownloadIcal}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>カレンダーに追加</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onDeleteClick();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
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
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

