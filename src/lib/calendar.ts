/**
 * カレンダー登録用のユーティリティ関数
 */

/**
 * 日時をGoogleカレンダー形式（YYYYMMDDTHHmmss）に変換
 * @param date 日時
 * @returns Googleカレンダー形式の文字列
 */
function formatDateForGoogleCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Googleカレンダーに追加するためのURLを生成
 * @param title イベントタイトル
 * @param startDate 開始日時
 * @param endDate 終了日時（省略時は開始日時の1時間後）
 * @param description 詳細説明
 * @param location 場所（任意）
 * @returns GoogleカレンダーのURL
 */
export function generateGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  description = "",
  location = "",
}: {
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
}): string {
  const start = formatDateForGoogleCalendar(startDate);
  const end = formatDateForGoogleCalendar(
    endDate || new Date(startDate.getTime() + 60 * 60 * 1000)
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
  });

  if (description) {
    params.append("details", description);
  }

  if (location) {
    params.append("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * iCal形式のファイル内容を生成
 * @param title イベントタイトル
 * @param startDate 開始日時
 * @param endDate 終了日時（省略時は開始日時の1時間後）
 * @param description 詳細説明
 * @param location 場所（任意）
 * @returns iCal形式の文字列
 */
export function generateICalContent({
  title,
  startDate,
  endDate,
  description = "",
  location = "",
}: {
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
}): string {
  const end = endDate || new Date(startDate.getTime() + 60 * 60 * 1000);

  // iCal形式の日時（UTC形式）
  const formatICalDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const startStr = formatICalDate(startDate);
  const endStr = formatICalDate(end);

  // 改行をエスケープ
  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const escapedTitle = escapeText(title);
  const escapedDescription = escapeText(description);
  const escapedLocation = escapeText(location);

  // UIDを生成（一意性を保つため）
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@itasha-owners-portal`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Itasha Owners Portal//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapedTitle}`,
    description ? `DESCRIPTION:${escapedDescription}` : "",
    location ? `LOCATION:${escapedLocation}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((line) => line !== "")
    .join("\r\n");
}

/**
 * iCalファイルをダウンロード
 * @param content iCal形式の文字列
 * @param filename ファイル名（デフォルト: reminder.ics）
 */
export function downloadICalFile(
  content: string,
  filename: string = "reminder.ics"
): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * デバイスがiOSかどうかを判定
 * @returns iOSデバイスかどうか
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * デバイスがAndroidかどうかを判定
 * @returns Androidデバイスかどうか
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return /Android/.test(navigator.userAgent);
}

