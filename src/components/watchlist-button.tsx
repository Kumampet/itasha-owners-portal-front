"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";

type WatchlistButtonProps = {
  eventId: string;
  className?: string;
  onToggle?: (isWatching: boolean) => void;
};

export function WatchlistButton({ eventId, className, onToggle }: WatchlistButtonProps) {
  const { data: session, status } = useSession();
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayWatching, setDisplayWatching] = useState(false); // アニメーション中の表示状態

  // ウォッチリスト状態を取得
  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

        const checkWatchlistStatus = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/watchlist`);
        if (res.ok) {
          const data = await res.json();
          const watching = data.isWatching || false;
          setIsWatching(watching);
          setDisplayWatching(watching);
        }
      } catch (error) {
        console.error("Failed to check watchlist status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWatchlistStatus();
  }, [eventId, session]);

  const handleToggle = async () => {
    if (!session || isLoading) return;

    const newIsWatching = !isWatching;
    
    // アニメーション開始時に表示状態を更新（回転アニメーションで切り替わる）
    setDisplayWatching(newIsWatching);
    setIsAnimating(true);
    
    try {
      const method = isWatching ? "DELETE" : "POST";
      const res = await fetch(`/api/events/${eventId}/watchlist`, {
        method,
      });

      if (!res.ok) throw new Error("Failed to toggle watchlist");

      setIsWatching(newIsWatching);
      onToggle?.(newIsWatching);

      // アニメーション完了
      setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
      // エラー時は元の状態に戻す
      setDisplayWatching(isWatching);
      setIsAnimating(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <button disabled className={className}>
        <span className="flex items-center gap-1 text-zinc-400">
          <span className="text-lg font-light">+</span>
          <span>ウォッチリスト</span>
        </span>
      </button>
    );
  }

  if (!session) {
    return (
      <Tooltip
        content="この機能はログインすることでご利用いただけます。"
        disabled={false}
        arrowPosition="right"
      >
        <button
          aria-disabled="true"
          onClick={(e) => {
            e.preventDefault();
          }}
          className={`${className} cursor-not-allowed opacity-50`}
        >
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="text-lg font-light">+</span>
            <span>ウォッチリスト</span>
          </span>
        </button>
      </Tooltip>
    );
  }

  // 登録済み時のボタンスタイルを決定（表示状態に基づく）
  // classNameから既存の背景色やボーダー色を削除し、登録済み時のスタイルを追加
  const baseClasses = className || "";
  const buttonClassName = displayWatching
    ? baseClasses
        .replace(/border-zinc-\d+|bg-white|bg-zinc-\d+|hover:bg-zinc-\d+/g, "")
        .trim() + " bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
    : baseClasses;

  // テキストの色を決定（表示状態に基づく）
  const textColor = displayWatching ? "text-emerald-700" : "text-zinc-700";

  return (
    <button
      onClick={handleToggle}
      className={`${buttonClassName} relative flex items-center justify-center gap-1`}
      disabled={isAnimating}
    >
      <span className="flex items-center gap-1">
        {/* アイコン部分：固定サイズでレイアウトシフトを防ぐ */}
        <span
          className="relative inline-flex items-center justify-center w-5 h-5"
          style={{ minWidth: "1.25rem", minHeight: "1.25rem" }}
        >
          {/* ＋アイコン */}
          <span
            className={`absolute text-lg font-light transition-all duration-200 ${
              displayWatching
                ? "rotate-90 scale-0 opacity-0"
                : isAnimating
                ? "rotate-180 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            } text-zinc-400`}
          >
            +
          </span>
          {/* -アイコン */}
          <span
            className={`absolute text-lg font-light transition-all duration-200 ${
              !displayWatching
                ? "-rotate-90 scale-0 opacity-0"
                : isAnimating
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-0 scale-100 opacity-100"
            } text-emerald-600`}
          >
            −
          </span>
        </span>
        <span className={textColor}>ウォッチリスト</span>
      </span>
    </button>
  );
}

