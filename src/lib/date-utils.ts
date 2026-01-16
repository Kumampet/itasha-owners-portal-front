import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// dayjsプラグインを拡張
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 日時のロケール設定
 * 将来的に多言語対応を可能にするための型定義
 */
export type DateLocale = "ja-JP" | "en-US";

/**
 * デフォルトのタイムゾーン（JST）
 */
const DEFAULT_TIMEZONE = "Asia/Tokyo";

/**
 * 日時をJSTに変換する
 */
function toJST(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(date).tz(DEFAULT_TIMEZONE);
}

/**
 * ロケールに応じた日付フォーマットを取得
 * @param locale ロケール（デフォルト: "ja-JP"）
 * @returns 日付フォーマット文字列
 */
function getDateFormat(locale: DateLocale = "ja-JP"): string {
  switch (locale) {
    case "ja-JP":
      return "YYYY年MM月DD日";
    case "en-US":
      return "MMM DD, YYYY";
    default:
      return "YYYY年MM月DD日";
  }
}

/**
 * ロケールに応じた日時フォーマットを取得
 * @param locale ロケール（デフォルト: "ja-JP"）
 * @returns 日時フォーマット文字列
 */
function getDateTimeFormat(locale: DateLocale = "ja-JP"): string {
  switch (locale) {
    case "ja-JP":
      return "YYYY年MM月DD日 HH:mm";
    case "en-US":
      return "MMM DD, YYYY HH:mm";
    default:
      return "YYYY年MM月DD日 HH:mm";
  }
}

/**
 * 日付のみをフォーマット（年月日のみ）
 * @param date 日付（文字列、Dateオブジェクト、またはdayjsオブジェクト）
 * @param locale ロケール（デフォルト: "ja-JP"）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: string | Date | dayjs.Dayjs | null | undefined,
  locale: DateLocale = "ja-JP"
): string {
  if (!date) {
    return "";
  }

  try {
    const jstDate = toJST(date);
    if (!jstDate.isValid()) {
      return "";
    }
    return jstDate.format(getDateFormat(locale));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * 日時をフォーマット（年月日と時間、秒は含まない）
 * @param date 日時（文字列、Dateオブジェクト、またはdayjsオブジェクト）
 * @param locale ロケール（デフォルト: "ja-JP"）
 * @returns フォーマットされた日時文字列
 */
export function formatDateTime(
  date: string | Date | dayjs.Dayjs | null | undefined,
  locale: DateLocale = "ja-JP"
): string {
  if (!date) {
    return "";
  }

  try {
    const jstDate = toJST(date);
    if (!jstDate.isValid()) {
      return "";
    }
    return jstDate.format(getDateTimeFormat(locale));
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "";
  }
}

/**
 * 日付範囲をフォーマット（複数日開催用）
 * @param startDate 開始日
 * @param endDate 終了日（オプション）
 * @param locale ロケール（デフォルト: "ja-JP"）
 * @returns フォーマットされた日付範囲文字列
 */
export function formatDateRange(
  startDate: string | Date | dayjs.Dayjs | null | undefined,
  endDate: string | Date | dayjs.Dayjs | null | undefined,
  locale: DateLocale = "ja-JP"
): string {
  if (!startDate) {
    return "";
  }

  const start = formatDate(startDate, locale);
  if (!endDate) {
    return start;
  }

  const end = formatDate(endDate, locale);
  return locale === "ja-JP" ? `${start} 〜 ${end}` : `${start} - ${end}`;
}
