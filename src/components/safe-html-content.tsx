"use client";

import { useMemo, useEffect, useRef, memo, useLayoutEffect } from "react";
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
function SafeHtmlContentInner({
  html,
  className = "",
  onImageClick,
}: SafeHtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /** クリック時は常に最新のコールバックへ（effect の依存を増やさないため） */
  const onImageClickRef = useRef(onImageClick);

  useLayoutEffect(() => {
    onImageClickRef.current = onImageClick;
  }, [onImageClick]);

  const sanitizedHtml = useMemo(() => {
    if (typeof window !== "undefined") {
      return sanitizeHtmlForDisplay(html);
    }
    // サーバーサイドでは空文字列を返す（クライアントサイドで再サニタイズ）
    return "";
  }, [html]);

  // サニタイズ結果が変わったときだけ付与。コールバックの参照変化では走らせない（img の再読み込み防止）
  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll("img");
    const cleanups: (() => void)[] = [];

    images.forEach((img) => {
      img.classList.add("max-h-32", "sm:max-h-48");
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.objectFit = "contain";

      const handleImageClick = (e: Event) => {
        const targetImg = e.target as HTMLImageElement;
        const cb = onImageClickRef.current;
        if (!cb || !targetImg.src) return;
        cb(targetImg.src);
      };

      img.addEventListener("click", handleImageClick);
      cleanups.push(() => {
        img.removeEventListener("click", handleImageClick);
      });

      if (onImageClickRef.current) {
        img.style.cursor = "pointer";
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [sanitizedHtml]);

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

/**
 * html / className / onImageClick が変わらない限り再レンダーしない。
 * 親（例: メッセージバブルのホバー）だけが変わっても、onImageClick が安定していれば dangerouslySetInnerHTML が触られず img の再読み込みを防げる。
 */
export const SafeHtmlContent = memo(SafeHtmlContentInner);
