/**
 * サーバーサイド用HTMLサニタイザー
 * 基本的な正規表現ベースのサニタイズ（isomorphic-dompurifyの依存関係問題を回避）
 * クライアントサイドでDOMPurifyによるサニタイズが行われていることを前提とする
 */

// 許可するHTMLタグ
const ALLOWED_TAGS = [
  "p",
  "span",
  "div",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

/**
 * HTMLをサニタイズして安全にします（サーバーサイド用）
 * 基本的な検証のみを行い、詳細なサニタイズはクライアントサイドで行われることを前提とする
 * @param html サニタイズするHTML文字列
 * @returns サニタイズ済みのHTML文字列
 */
export function sanitizeHtmlServer(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // 危険なタグを削除
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // イベントハンドラーを削除
    .replace(/javascript:/gi, ""); // javascript:プロトコルを削除

  // 許可されたタグ以外をエスケープ（基本的な検証）
  // ただし、クライアントサイドで既にサニタイズされていることを前提とする
  // ここでは危険なパターンのみを削除

  // リンクのrel属性を強制的に追加（nofollow, noreferrer）
  try {
    sanitized = sanitized.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        try {
          // href属性があるか確認
          if (!attrs || !attrs.includes("href=")) {
            return match;
          }

          // target属性を追加または更新
          let newAttrs = attrs || "";
          if (!newAttrs.includes("target=")) {
            newAttrs += ' target="_blank"';
          } else {
            newAttrs = newAttrs.replace(/target="[^"]*"/gi, 'target="_blank"');
          }

          // rel属性を追加または更新
          if (!newAttrs.includes("rel=")) {
            newAttrs += ' rel="nofollow noreferrer"';
          } else {
            const relMatch = newAttrs.match(/rel="([^"]*)"/i);
            if (relMatch && relMatch[1]) {
              const relValues = new Set(relMatch[1].split(" ").filter(Boolean));
              relValues.add("nofollow");
              relValues.add("noreferrer");
              newAttrs = newAttrs.replace(/rel="[^"]*"/gi, `rel="${Array.from(relValues).join(" ")}"`);
            } else {
              newAttrs += ' rel="nofollow noreferrer"';
            }
          }

          return `<a ${newAttrs}>`;
        } catch (replaceError) {
          // 置換に失敗した場合は元のマッチを返す
          console.error("Error replacing link attributes:", replaceError);
          return match;
        }
      }
    );
  } catch (linkError) {
    // リンクの処理に失敗した場合はそのまま返す（クライアントサイドでサニタイズされていることを前提）
    console.error("Error processing links:", linkError);
  }

  return sanitized;
}
