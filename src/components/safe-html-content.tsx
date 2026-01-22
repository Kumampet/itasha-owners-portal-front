"use client";

import { useMemo } from "react";
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
}

/**
 * HTMLコンテンツを安全に表示するコンポーネント
 * XSS対策としてDOMPurifyでサニタイズしてから表示
 */
export function SafeHtmlContent({
  html,
  className = "",
}: SafeHtmlContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (typeof window !== "undefined") {
      return sanitizeHtmlForDisplay(html);
    }
    // サーバーサイドでは空文字列を返す（クライアントサイドで再サニタイズ）
    return "";
  }, [html]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      className={`group-description-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{
        // フォントサイズのスタイル
        fontSize: "14px",
      }}
    />
  );
}
