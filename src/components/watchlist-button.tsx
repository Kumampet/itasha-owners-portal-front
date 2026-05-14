"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
// TODO: 通知設定機能を削除しました。将来的に再実装する場合は、useRouterをインポートして使用してください。
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/button";
// TODO: 通知設定機能を削除しました。将来的に再実装する場合は、shouldRedirectToNotificationSettingsをインポートして使用してください。

type WatchlistButtonProps = {
  eventId: string;
  className?: string;
  onToggle?: (isWatching: boolean) => void;
  /** アイコンのみの正円ボタン（一覧カードのオーバーレイ向け） */
  iconOnly?: boolean;
};

const iconOnlyBaseClasses =
  "!h-9 !w-9 !min-h-9 !min-w-9 shrink-0 !p-0 !gap-0 rounded-full border border-white/35 bg-black/40 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55 hover:border-white/50";

export function WatchlistButton({ eventId, className, onToggle, iconOnly = false }: WatchlistButtonProps) {
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

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session || isLoading) return;

    // TODO: 通知設定機能を削除しました。将来的に再実装する場合は、ウォッチリストに追加する際に通知設定をチェックするロジックを追加してください。

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

  const loadingAria = iconOnly ? "ウォッチリスト状態を読み込み中" : undefined;
  const guestAria = iconOnly ? "ウォッチリスト（ログインが必要です）" : undefined;

  if (status === "loading" || isLoading) {
    return (
      <Button
        as="action"
        disabled
        onClick={(e) => e.stopPropagation()}
        className={iconOnly ? `${iconOnlyBaseClasses} ${className ?? ""}`.trim() : className}
        aria-label={loadingAria}
      >
        {iconOnly ? (
          <span className="text-lg font-light text-white/50">+</span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="text-lg font-light">+</span>
            <span>ウォッチリスト</span>
          </span>
        )}
      </Button>
    );
  }

  if (!session) {
    const guestButton = (
      <Button
        as="action"
        disabled
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={iconOnly ? `${iconOnlyBaseClasses} ${className ?? ""}`.trim() : className}
        aria-label={guestAria}
      >
        {iconOnly ? (
          <span className="text-lg font-light text-white/45">+</span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="text-lg font-light">+</span>
            <span>ウォッチリスト</span>
          </span>
        )}
      </Button>
    );

    return (
      <Tooltip
        content="この機能はログインすることでご利用いただけます。"
        disabled={false}
        arrowPosition="right"
      >
        {guestButton}
      </Tooltip>
    );
  }

  // 登録済み時のボタンスタイルを決定（表示状態に基づく）
  // classNameから既存の背景色やボーダー色を削除し、登録済み時のスタイルを追加
  const baseClasses = iconOnly
    ? `${iconOnlyBaseClasses} ${className ?? ""}`.trim()
    : className || "";

  const buttonClassName = iconOnly
    ? displayWatching
      ? `${baseClasses.replace(/\s+/g, " ").trim()} border-accent-mint/60 bg-accent-mint/30 hover:bg-accent-mint/40 hover:border-accent-mint/70`
      : baseClasses
    : displayWatching
      ? baseClasses
        .replace(/border-zinc-\d+|bg-card|bg-zinc-\d+|hover:bg-zinc-\d+/g, "")
        .trim() + " bg-accent-mint/10 border-accent-mint/25 hover:bg-accent-mint/15"
      : baseClasses;

  // テキストの色を決定（表示状態に基づく）
  const textColor = displayWatching ? "text-accent-mint" : "text-muted-foreground";

  const toggleAria = iconOnly
    ? displayWatching
      ? "ウォッチリストから削除"
      : "ウォッチリストに追加"
    : undefined;

  const iconPlusMinusClasses = iconOnly
    ? {
        plusIdle: displayWatching
          ? "rotate-90 scale-0 opacity-0 text-white"
          : isAnimating
            ? "rotate-180 scale-0 opacity-0 text-white"
            : "rotate-0 scale-100 opacity-100 text-white",
        minusIdle: !displayWatching
          ? "-rotate-90 scale-0 opacity-0 text-accent-mint"
          : isAnimating
            ? "rotate-0 scale-100 opacity-100 text-accent-mint"
            : "rotate-0 scale-100 opacity-100 text-accent-mint",
      }
    : {
        plusIdle: displayWatching
          ? "rotate-90 scale-0 opacity-0"
          : isAnimating
            ? "rotate-180 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        minusIdle: !displayWatching
          ? "-rotate-90 scale-0 opacity-0"
          : isAnimating
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-0 scale-100 opacity-100",
      };

  return (
    <Button
      as="action"
      onClick={handleToggle}
      className={`${buttonClassName} relative flex items-center justify-center ${iconOnly ? "" : "gap-1"}`}
      disabled={isAnimating}
      aria-label={toggleAria}
      aria-pressed={iconOnly ? displayWatching : undefined}
    >
      <span className={`flex items-center ${iconOnly ? "justify-center" : "gap-1"}`}>
        {/* アイコン部分：固定サイズでレイアウトシフトを防ぐ */}
        <span
          className="relative inline-flex h-5 w-5 items-center justify-center"
          style={{ minWidth: "1.25rem", minHeight: "1.25rem" }}
        >
          {/* ＋アイコン */}
          <span
            className={`absolute text-lg font-light transition-all duration-200 ${iconPlusMinusClasses.plusIdle} ${!iconOnly ? "text-zinc-400" : ""}`}
          >
            +
          </span>
          {/* -アイコン */}
          <span
            className={`absolute text-lg font-light transition-all duration-200 ${iconPlusMinusClasses.minusIdle} ${!iconOnly ? "text-accent-mint" : ""}`}
          >
            −
          </span>
        </span>
        {!iconOnly ? <span className={textColor}>ウォッチリスト</span> : null}
      </span>
    </Button>
  );
}

