import createDOMPurify from "isomorphic-dompurify";

/**
 * サーバーサイド用HTMLサニタイザー
 * isomorphic-dompurifyを使用してサーバーサイドでもHTMLをサニタイズ
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

// 許可するHTML属性
const ALLOWED_ATTR = ["href", "target", "rel", "style"];

// 許可するインラインスタイルプロパティ
const ALLOWED_STYLES = [
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
];

/**
 * HTMLをサニタイズして安全にします（サーバーサイド用）
 * @param html サニタイズするHTML文字列
 * @returns サニタイズ済みのHTML文字列
 */
export function sanitizeHtmlServer(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  const DOMPurify = createDOMPurify();

  let sanitized = String(DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // styleタグは許可しない（インラインスタイルのみ）
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    // インラインスタイルの許可プロパティを設定
    ALLOW_DATA_ATTR: false,
  } as any));

  // リンクのrel属性を強制的に追加（nofollow, noreferrer）
  // 基本的な正規表現で処理
  sanitized = sanitized.replace(
    /<a\s+([^>]*?)>/gi,
    (match, attrs) => {
      // href属性があるか確認
      if (!attrs.includes("href=")) {
        return match;
      }

      // target属性を追加または更新
      let newAttrs = attrs;
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
        if (relMatch) {
          const relValues = new Set(relMatch[1].split(" ").filter(Boolean));
          relValues.add("nofollow");
          relValues.add("noreferrer");
          newAttrs = newAttrs.replace(/rel="[^"]*"/gi, `rel="${Array.from(relValues).join(" ")}"`);
        } else {
          newAttrs += ' rel="nofollow noreferrer"';
        }
      }

      return `<a ${newAttrs}>`;
    }
  );

  return sanitized;
}
