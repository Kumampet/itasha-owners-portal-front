"use client";

import { useMemo, useEffect, useRef } from "react";
import { sanitizeHtmlForDisplay } from "@/lib/html-sanitizer";

interface SafeHtmlContentProps {
  /**
   * 表示するHTMLコンテンツ
   */
  html: string;
  /**
   * コンテナのクラス名
   */
  className?: string;
  /**
   * 画像クリック時のコールバック
   */
  onImageClick?: (imageUrl: string) => void;
}

/**
 * HTMLコンテンツを安全に表示するコンポーネント
 * XSS対策としてDOMPurifyでサニタイズしてから表示
 */
export function SafeHtmlContent({
  html,
  className = "",
  onImageClick,
}: SafeHtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sanitizedHtml = useMemo(() => {
    if (typeof window !== "undefined") {
      return sanitizeHtmlForDisplay(html);
    }
    // サーバーサイドでは空文字列を返す（クライアントサイドで再サニタイズ）
    return "";
  }, [html]);

  // 画像にクリックイベントとスタイルを追加
  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll("img");
    
    images.forEach((img) => {
      // クリックイベントを追加
      if (onImageClick) {
        img.style.cursor = "pointer";
        const handleImageClick = (e: Event) => {
          const targetImg = e.target as HTMLImageElement;
          if (targetImg.src) {
            onImageClick(targetImg.src);
          }
        };
        img.addEventListener("click", handleImageClick);
      }

      // 最大高さのスタイルを追加（プレビューと同じ）
      // 既存のスタイルを保持しつつ、max-heightを追加
      img.classList.add("max-h-32", "sm:max-h-48");
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.objectFit = "contain";
    });

    return () => {
      // イベントリスナーは自動的にクリーンアップされる（DOM要素が削除されるため）
    };
  }, [sanitizedHtml, onImageClick]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`group-description-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{
        // フォントサイズのスタイル
        fontSize: "14px",
      }}
    />
  );
}
