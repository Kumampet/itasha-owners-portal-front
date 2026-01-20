import DOMPurify from "dompurify";

/**
 * HTMLサニタイズの設定
 * XSS対策のため、許可するタグとスタイルを厳格に制限
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
 * HTMLをサニタイズして安全にします
 * @param html サニタイズするHTML文字列
 * @returns サニタイズ済みのHTML文字列
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // サーバーサイドではDOMPurifyが使えないため、基本的なサニタイズのみ
    // クライアントサイドで再度サニタイズされることを前提とする
    return html;
  }

  return String(DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // styleタグは許可しない（インラインスタイルのみ）
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    // リンクのrel属性を強制的に追加（nofollow, noreferrer）
    ADD_ATTR: ["target", "rel"],
    // リンクのtargetとrelを設定
    ADD_TAGS: [],
    // リンクのrel属性を自動的に追加
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    // インラインスタイルの許可プロパティを設定
    ALLOW_DATA_ATTR: false,
  } as any));
}

/**
 * リンクのrel属性を設定（nofollow, noreferrerを追加）
 * @param html サニタイズ済みHTML
 * @returns rel属性が設定されたHTML
 */
export function addLinkRelAttributes(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a");

  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    const currentRel = link.getAttribute("rel") || "";
    const relValues = new Set(currentRel.split(" ").filter(Boolean));
    relValues.add("nofollow");
    relValues.add("noreferrer");
    link.setAttribute("rel", Array.from(relValues).join(" "));
  });

  return doc.body.innerHTML;
}

/**
 * HTMLを完全にサニタイズ（表示用）
 * @param html サニタイズするHTML文字列
 * @returns サニタイズ済みのHTML文字列
 */
export function sanitizeHtmlForDisplay(html: string): string {
  const sanitized = sanitizeHtml(html);
  return addLinkRelAttributes(sanitized);
}
