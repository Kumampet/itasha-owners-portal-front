/**
 * サーバーサイド用HTMLサニタイザー
 * 基本的な正規表現ベースのサニタイズ（isomorphic-dompurifyの依存関係問題を回避）
 * クライアントサイドでDOMPurifyによるサニタイズが行われていることを前提とする
 */

// 許可するHTMLタグ（将来の拡張用に定義）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  "ul",
  "ol",
  "li",
  "img",
];

// 許可するインラインスタイルプロパティ（クライアントサイドと同じリスト）
const ALLOWED_STYLE_PROPERTIES = [
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "letter-spacing",
];

/**
 * style属性から許可されていないスタイルプロパティを削除（サーバーサイド用）
 * @param styleValue style属性の値
 * @returns 許可されたスタイルのみを含む文字列
 */
function filterAllowedStyles(styleValue: string): string {
  if (!styleValue || typeof styleValue !== "string") {
    return "";
  }

  // スタイルプロパティをパース
  const styles = styleValue.split(";").map((s) => s.trim()).filter(Boolean);
  const allowedStyles: string[] = [];

  for (const style of styles) {
    const colonIndex = style.indexOf(":");
    if (colonIndex === -1) continue;

    const property = style.substring(0, colonIndex).trim().toLowerCase();
    const value = style.substring(colonIndex + 1).trim();

    // 許可されたプロパティかチェック
    if (ALLOWED_STYLE_PROPERTIES.includes(property)) {
      allowedStyles.push(`${property}: ${value}`);
    }
  }

  return allowedStyles.join("; ");
}

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
    .replace(/javascript:/gi, "") // javascript:プロトコルを削除
    .replace(/<img\b[^>]*src\s*=\s*["']javascript:/gi, ""); // imgタグのjavascript:プロトコルを削除

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

  // style属性から許可されていないスタイルを削除
  try {
    sanitized = sanitized.replace(
      /style\s*=\s*["']([^"']*)["']/gi,
      (match, styleValue) => {
        try {
          const filteredStyle = filterAllowedStyles(styleValue);
          if (filteredStyle) {
            return `style="${filteredStyle}"`;
          }
          // 許可されたスタイルが1つもない場合はstyle属性を削除
          return "";
        } catch (styleError) {
          console.error("Error filtering styles:", styleError);
          return "";
        }
      }
    );
  } catch (styleFilterError) {
    console.error("Error processing styles:", styleFilterError);
  }

  return sanitized;
}
