"use client";

import { parseTextWithUrls, isValidUrl } from "@/lib/message-utils";

interface SafeMessageContentProps {
  /**
   * 表示するメッセージの内容
   */
  content: string;
  /**
   * テキストのクラス名
   */
  className?: string;
  /**
   * リンクのクラス名
   */
  linkClassName?: string;
}

/**
 * XSS対策を施し、URLを自動的にリンクに変換するメッセージ表示コンポーネント
 */
export function SafeMessageContent({
  content,
  className = "",
  linkClassName = "",
}: SafeMessageContentProps) {
  // テキストをパースしてURLを検出
  const parts = parseTextWithUrls(content);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.isUrl && isValidUrl(part.text)) {
          // URLの場合はリンクとして表示
          return (
            <a
              key={index}
              href={part.text}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:opacity-80 ${linkClassName}`}
            >
              {part.text}
            </a>
          );
        } else {
          // テキストの場合はそのまま表示（Reactが自動的にエスケープする）
          // 改行を保持するためにwhitespace-pre-wrapが必要（親要素に設定されているが、念のため）
          return <span key={index} className="whitespace-pre-wrap">{part.text}</span>;
        }
      })}
    </span>
  );
}

