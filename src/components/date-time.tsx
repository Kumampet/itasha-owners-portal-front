"use client";

import type { ReactNode } from "react";

type DateInput = Date | string | null | undefined;

type TextSize = "xs" | "sm" | "md" | "lg" | "xl";

type DateTimeFormat =
    | "full" // 2024年1月15日月曜日
    | "long" // 2024年1月15日
    | "medium" // 2024/01/15
    | "short" // 24/01/15
    | "date-time" // 2024/01/15 12:30
    | "date-time-full" // 2024年1月15日 12時30分
    | "time" // 12:30
    | "time-full" // 12時30分
    | "weekday-short" // 2024年1月15日(月)
    | "weekday-long" // 2024年1月15日月曜日
    | "month-day" // 1月15日
    | "month-day-short" // 2024年1月15日
    | "year-month" // 2024年1月
    | string; // カスタムフォーマット（yyyy-mm-ddThh:MM:ss形式）

interface DateTimeProps {
    date: DateInput;
    format?: DateTimeFormat;
    size?: TextSize;
    className?: string;
    fallback?: ReactNode;
}

const sizeClasses: Record<TextSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
};

function parseCustomFormat(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
        .replace(/yyyy/g, String(year))
        .replace(/mm/g, month)
        .replace(/dd/g, day)
        .replace(/hh/g, hours)
        .replace(/MM/g, minutes)
        .replace(/ss/g, seconds);
}

function formatDateTime(date: Date, format: DateTimeFormat): string {
    switch (format) {
        case "full":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
            }).format(date);
        case "long":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }).format(date);
        case "medium":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(date);
        case "short":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
            }).format(date);
        case "date-time":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        case "date-time-full":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
            }).format(date);
        case "time":
            return new Intl.DateTimeFormat("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        case "time-full":
            return new Intl.DateTimeFormat("ja-JP", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
            }).format(date);
        case "weekday-short":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                weekday: "short",
            }).format(date);
        case "weekday-long":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
            }).format(date);
        case "month-day":
            return new Intl.DateTimeFormat("ja-JP", {
                month: "long",
                day: "numeric",
            }).format(date);
        case "month-day-short":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }).format(date);
        case "year-month":
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
            }).format(date);
        default:
            // カスタムフォーマット（yyyy-mm-ddThh:MM:ss形式）
            if (typeof format === "string" && (format.includes("yyyy") || format.includes("mm") || format.includes("dd"))) {
                return parseCustomFormat(date, format);
            }
            // デフォルトはmedium
            return new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(date);
    }
}

export function DateTime({
    date,
    format = "medium",
    size = "md",
    className = "",
    fallback = null,
}: DateTimeProps) {
    if (!date) {
        return <>{fallback}</>;
    }

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return <>{fallback}</>;
    }

    const formatted = formatDateTime(dateObj, format);
    const sizeClass = sizeClasses[size];
    const combinedClassName = `${sizeClass} ${className}`.trim();

    return <span className={combinedClassName || undefined}>{formatted}</span>;
}

