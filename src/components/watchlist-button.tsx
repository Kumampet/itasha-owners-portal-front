"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/button";
import { IconEye } from "@/components/icons";
import { useSnackbar } from "@/contexts/snackbar-context";

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
  const { showSnackbar } = useSnackbar();
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsWatching(data.isWatching || false);
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

    const newIsWatching = !isWatching;
    setIsWatching(newIsWatching);

    try {
      const method = isWatching ? "DELETE" : "POST";
      const res = await fetch(`/api/events/${eventId}/watchlist`, { method });

      if (!res.ok) throw new Error("Failed to toggle watchlist");

      onToggle?.(newIsWatching);

      if (newIsWatching) {
        showSnackbar("ウォッチリストに追加されました。", "success");
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
      setIsWatching(isWatching);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <Button
        as="action"
        disabled
        onClick={(e) => e.stopPropagation()}
        className={iconOnly ? `${iconOnlyBaseClasses} ${className ?? ""}`.trim() : className}
        aria-label={iconOnly ? "ウォッチリスト状態を読み込み中" : undefined}
      >
        {iconOnly ? (
          <IconEye className="h-4 w-4 text-white/50" />
        ) : (
          <span className="flex items-center gap-1 text-zinc-400">
            <IconEye className="h-4 w-4" />
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
        aria-label={iconOnly ? "ウォッチリスト（ログインが必要です）" : undefined}
      >
        {iconOnly ? (
          <IconEye className="h-4 w-4 text-white/45" />
        ) : (
          <span className="flex items-center gap-1 text-zinc-400">
            <IconEye className="h-4 w-4" />
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

  const baseClasses = iconOnly
    ? `${iconOnlyBaseClasses} ${className ?? ""}`.trim()
    : className || "";

  const buttonClassName = iconOnly
    ? isWatching
      ? `${baseClasses} border-accent-mint/60 bg-accent-mint/30 hover:bg-accent-mint/40 hover:border-accent-mint/70`
          .replace("bg-black/40", "")
          .replace("hover:bg-black/55", "")
          .replace(/\s+/g, " ")
          .trim()
      : baseClasses
    : isWatching
      ? baseClasses
          .replace(/border-zinc-\d+|bg-card|bg-zinc-\d+|hover:bg-zinc-\d+/g, "")
          .trim() + " bg-accent-mint/10 border-accent-mint/25 hover:bg-accent-mint/15"
      : baseClasses;

  return (
    <Button
      as="action"
      onClick={handleToggle}
      className={`${buttonClassName} relative flex items-center justify-center ${iconOnly ? "" : "gap-1"}`}
      aria-label={iconOnly ? (isWatching ? "ウォッチリストから削除" : "ウォッチリストに追加") : undefined}
      aria-pressed={iconOnly ? isWatching : undefined}
    >
      <span className={`flex items-center ${iconOnly ? "justify-center" : "gap-1"}`}>
        {iconOnly ? (
          <IconEye className={`h-4 w-4 ${isWatching ? "text-accent-mint" : "text-white"}`} />
        ) : (
          <>
            <IconEye className={`h-4 w-4 ${isWatching ? "text-accent-mint" : "text-zinc-400"}`} />
            <span className={isWatching ? "text-accent-mint" : "text-muted-foreground"}>
              ウォッチリスト
            </span>
          </>
        )}
      </span>
    </Button>
  );
}
