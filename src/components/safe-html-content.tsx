"use client";

import { useEffect, useState } from "react";
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
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sanitized = sanitizeHtmlForDisplay(html);
      setSanitizedHtml(sanitized);
    } else {
      // サーバーサイドでは空文字列を設定（クライアントサイドで再サニタイズ）
      setSanitizedHtml("");
    }
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
