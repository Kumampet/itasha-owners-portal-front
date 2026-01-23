"use client";

import { useEffect, useState, useRef } from "react";
import { useSnackbar, SnackbarMessage } from "@/contexts/snackbar-context";

const severityStyles = {
  success: "bg-emerald-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-500 text-white",
};

const severityIcons = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export function Snackbar() {
  const { messages, removeMessage } = useSnackbar();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const prevMessagesRef = useRef<SnackbarMessage[]>([]);

  useEffect(() => {
    const currentIds = new Set(messages.map((m) => m.id));
    const prevIds = new Set(prevMessagesRef.current.map((m) => m.id));
    
    // 新しいメッセージを検出
    const newMessages = messages.filter((msg) => !prevIds.has(msg.id));
    
    // 削除されたメッセージを検出
    const removedIds = Array.from(prevIds).filter((id) => !currentIds.has(id));

    let timer: NodeJS.Timeout | undefined;

    if (removedIds.length > 0) {
      // 削除されたメッセージを即座に削除
      setVisibleIds((prev) => {
        const next = new Set(prev);
        removedIds.forEach((id) => {
          next.delete(id);
        });
        return next;
      });
    }

    if (newMessages.length > 0) {
      // 新しいメッセージを追加（アニメーションのために少し遅延）
      timer = setTimeout(() => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          newMessages.forEach((msg) => {
            next.add(msg.id);
          });
          return next;
        });
      }, 10);
    }

    // 前回のメッセージを更新
    prevMessagesRef.current = messages;

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
      {messages.map((message) => (
        <SnackbarItem
          key={message.id}
          message={message}
          isVisible={visibleIds.has(message.id)}
          onClose={() => removeMessage(message.id)}
        />
      ))}
    </div>
  );
}

function SnackbarItem({
  message,
  isVisible,
  onClose,
}: {
  message: SnackbarMessage;
  isVisible: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`
        pointer-events-auto
        rounded-lg shadow-lg px-4 py-3 flex items-center gap-3
        ${severityStyles[message.severity]}
        transform transition-all duration-300 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
      role="alert"
    >
      <span className="flex-shrink-0 text-lg font-semibold">
        {severityIcons[message.severity]}
      </span>
      <p className="flex-1 text-sm font-medium">{message.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="閉じる"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
