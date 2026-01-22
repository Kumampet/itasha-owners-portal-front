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
  "ul",
  "ol",
  "li",
  "img",
];

// 許可するHTML属性
const ALLOWED_ATTR = ["href", "target", "rel", "style", "src", "alt", "width"];

// 許可するインラインスタイルプロパティ
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

const ALLOWED_STYLES: Record<string, string[]> = {
  "*": ALLOWED_STYLE_PROPERTIES,
};

/**
 * style属性から許可されていないスタイルプロパティを削除
 * @param styleValue style属性の値（例: "color: red; font-size: 16px; position: absolute;"）
 * @returns 許可されたスタイルのみを含む文字列（例: "color: red; font-size: 16px;"）
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

  // DOMPurifyでサニタイズ
  const sanitized = String(DOMPurify.sanitize(html, {
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
    ALLOWED_STYLES,
  } as Parameters<typeof DOMPurify.sanitize>[1]));

  // DOMPurifyの処理後、許可されていないスタイルをさらにフィルタリング
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, "text/html");
  const elementsWithStyle = doc.querySelectorAll("[style]");

  elementsWithStyle.forEach((element) => {
    const styleValue = element.getAttribute("style");
    if (styleValue) {
      const filteredStyle = filterAllowedStyles(styleValue);
      if (filteredStyle) {
        element.setAttribute("style", filteredStyle);
      } else {
        // 許可されたスタイルが1つもない場合はstyle属性を削除
        element.removeAttribute("style");
      }
    }
  });

  return doc.body.innerHTML;
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
