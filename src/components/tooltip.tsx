"use client";

import { useState, useRef, useEffect } from "react";

type TooltipProps = {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
  arrowPosition?: "left" | "center" | "right";
  className?: string;
};

/**
 * 汎用ツールチップコンポーネント
 * PC: クリックで表示、3秒後にフェードアウト
 * SP: タップで表示、3秒後にフェードアウト
 * arrowPosition: 吹き出し（矢印）の位置を指定（左下、中央、右下）
 */
export function Tooltip({
  children,
  content,
  disabled = false,
  arrowPosition = "center",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const touchHandledRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PC/SP共通: 3秒後に自動フェードアウト
  useEffect(() => {
    if (!isVisible) {
      // クリーンアップ
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsFading(false);
      return;
    }

    // 3秒後にフェードアウト開始
    timeoutRef.current = setTimeout(() => {
      setIsFading(true);
      // フェードアウトアニメーション（300ms）後に非表示
      fadeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, 300);
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [isVisible]);

  // 外側クリックで閉じる（PC用のみ、SPではタップで閉じない）
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // タッチイベントは除外（SPでは外側タップで閉じない）
      if (event.type === "touchstart" || event.type === "touchend") {
        return;
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFading(false);
        setIsVisible(false);
        // タイマーをクリア
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
          fadeTimeoutRef.current = null;
        }
      }
    };

    // PC用のみ（マウスイベントのみ）
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  const toggleTooltip = () => {
    if (disabled) return;

    // 既存のタイマーをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    setIsFading(false);
    setIsVisible((prev) => !prev);
  };

  const handleClick = (e: React.MouseEvent) => {
    // タッチイベントで処理済みの場合はスキップ
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    toggleTooltip();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;

    // タッチイベントで処理済みであることをマーク
    touchHandledRef.current = true;
    e.preventDefault();
    toggleTooltip();

    // 少し遅延させてからフラグをリセット（onClickが発火する前に）
    setTimeout(() => {
      touchHandledRef.current = false;
    }, 300);
  };

  // 吹き出しの位置に応じたツールチップの位置クラス
  // 矢印が左下の場合はツールチップを右にオフセット、右下の場合は左にオフセット
  const getTooltipPositionClass = () => {
    const baseClass = "bottom-full mb-2";
    if (arrowPosition === "left") {
      // 左下: ツールチップを右にオフセット（矢印が左下に来るように）
      return `${baseClass} left-0`;
    } else if (arrowPosition === "right") {
      // 右下: ツールチップを左にオフセット（矢印が右下に来るように）
      return `${baseClass} right-0`;
    } else {
      // 中央: デフォルトの中央配置
      return `${baseClass} left-1/2 -translate-x-1/2`;
    }
  };

  // 吹き出しの位置に応じた矢印の位置クラス
  const getArrowPositionClass = () => {
    const baseClass = "top-full border-t-zinc-900 border-l-transparent border-r-transparent border-b-transparent";
    if (arrowPosition === "left") {
      // 左下: 矢印を左下に配置
      return `${baseClass} left-3`;
    } else if (arrowPosition === "right") {
      // 右下: 矢印を右下に配置
      return `${baseClass} right-3`;
    } else {
      // 中央: 矢印を中央に配置
      return `${baseClass} left-1/2 -translate-x-1/2`;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"
            } ${getTooltipPositionClass()}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute h-0 w-0 border-4 ${getArrowPositionClass()}`}
          />
        </div>
      )}
    </div>
  );
}
