import { sanitizeHtmlServer } from "@/lib/server-html-sanitizer";

type AboutDetailParagraphProps = {
  /** 限定的な HTML（a, br 等）と `\n` 改行を含み得る。{@link sanitizeHtmlServer} でサニタイズする。 */
  html: string;
};

/**
 * サービス概要 about の本文ブロック。
 * Markdown ではなくソース内 HTML 限定のため、サーバー側サニタイズのみで十分とする。
 */
export function AboutDetailParagraph({ html }: AboutDetailParagraphProps) {
  const withBreaks = html.replace(/\r\n|\r|\n/g, "<br />");
  const sanitized = sanitizeHtmlServer(withBreaks);

  return (
    <div
      className="group-description-content text-sm leading-relaxed text-muted-foreground sm:text-base"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
