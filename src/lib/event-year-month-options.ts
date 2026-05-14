export type EventYearMonthOption = {
  value: string;
  label: string;
};

function getJstCalendarParts(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

function formatYearMonthLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

function toYearMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function isOnOrAfterJstYearMonth(
  year: number,
  month: number,
  startYear: number,
  startMonth: number
) {
  if (year > startYear) return true;
  if (year < startYear) return false;
  return month >= startMonth;
}

/** 開催年月プルダウン用。JST の今月以降、今年・翌年の暦月を列挙する。 */
export function buildEventYearMonthOptions(
  now = new Date(),
  includeValue?: string
): EventYearMonthOption[] {
  const { year: currentYear, month: currentMonth } = getJstCalendarParts(now);
  const options: EventYearMonthOption[] = [];

  for (let month = currentMonth; month <= 12; month += 1) {
    options.push({
      value: toYearMonthValue(currentYear, month),
      label: formatYearMonthLabel(currentYear, month),
    });
  }

  for (let month = 1; month <= 12; month += 1) {
    options.push({
      value: toYearMonthValue(currentYear + 1, month),
      label: formatYearMonthLabel(currentYear + 1, month),
    });
  }

  if (includeValue && /^\d{4}-\d{2}$/.test(includeValue)) {
    const exists = options.some((o) => o.value === includeValue);
    if (!exists) {
      const [ys, ms] = includeValue.split("-");
      const y = Number(ys);
      const m = Number(ms);
      if (
        Number.isInteger(y) &&
        Number.isInteger(m) &&
        m >= 1 &&
        m <= 12 &&
        isOnOrAfterJstYearMonth(y, m, currentYear, currentMonth) &&
        y <= currentYear + 1
      ) {
        options.push({
          value: includeValue,
          label: formatYearMonthLabel(y, m),
        });
        options.sort((a, b) => a.value.localeCompare(b.value));
      }
    }
  }

  return options;
}
