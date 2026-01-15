/**
 * メッセージのXSS対策とURLリンク化のユーティリティ
 */

/**
 * URLパターンを検出する正規表現
 * http://, https://, www. で始まるURLを検出
 */
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * テキスト内のURLを検出して配列に変換
 * @param text 検出対象のテキスト
 * @returns {text: string, isUrl: boolean}[] の配列
 */
export function parseTextWithUrls(text: string): Array<{ text: string; isUrl: boolean }> {
  const parts: Array<{ text: string; isUrl: boolean }> = [];
  let lastIndex = 0;
  let match;

  // 正規表現をリセット
  URL_PATTERN.lastIndex = 0;

  while ((match = URL_PATTERN.exec(text)) !== null) {
    // URLの前のテキストを追加
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isUrl: false,
      });
    }

    // URLを正規化（www.で始まる場合はhttps://を追加）
    let url = match[0];
    if (url.startsWith("www.")) {
      url = `https://${url}`;
    }

    // URLを追加
    parts.push({
      text: url,
      isUrl: true,
    });

    lastIndex = URL_PATTERN.lastIndex;
  }

  // 残りのテキストを追加
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isUrl: false,
    });
  }

  // マッチがない場合は全体をテキストとして返す
  if (parts.length === 0) {
    parts.push({ text, isUrl: false });
  }

  return parts;
}

/**
 * URLが有効かどうかを検証
 * @param url 検証対象のURL
 * @returns 有効なURLかどうか
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // httpまたはhttpsのみ許可
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

