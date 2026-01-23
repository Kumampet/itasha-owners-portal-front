"use client";

import { useState } from "react";
import { Button } from "./button";

type GroupInviteLinkCopyButtonProps = {
  groupCode: string;
};

// ツールチップの表示時間（ミリ秒）
const TOOLTIP_DISPLAY_DURATION = 2000;
// フェードアウトアニメーション時間（ミリ秒）
const FADE_OUT_DURATION = 300;

/**
 * 団体招待リンクをコピーするボタンコンポーネント
 * クリックすると招待リンクをクリップボードにコピーし、成功時にツールチップを表示します
 */
export function GroupInviteLinkCopyButton({
  groupCode,
}: GroupInviteLinkCopyButtonProps) {
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [isFading, setIsFading] = useState(false);

  /**
   * 招待リンクをクリップボードにコピーする
   */
  const handleCopyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/app/groups/join?groupCode=${groupCode}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShowCopyTooltip(true);
      setIsFading(false);

      // ツールチップを一定時間後にフェードアウト開始
      setTimeout(() => {
        setIsFading(true);
        // フェードアウトアニメーション後に非表示にする
        setTimeout(() => {
          setShowCopyTooltip(false);
          setIsFading(false);
        }, FADE_OUT_DURATION);
      }, TOOLTIP_DISPLAY_DURATION);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("招待リンクのコピーに失敗しました");
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant="secondary"
        size="sm"
        rounded="md"
        onClick={handleCopyInviteLink}
      >
        <svg
          className="mr-1.5 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        招待リンクをコピー
      </Button>
      {showCopyTooltip && (
        <div className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}>
          コピーしました！
          <div className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
