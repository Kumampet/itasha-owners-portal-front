 
import { eq } from "drizzle-orm";
import { db } from "./db";
import { events, eventEntries } from "../db/schema";
import { EVENT_DESCRIPTION_MAX_CHARS } from "@/lib/event-description";

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const cities = [
  "中央区", "港区", "新宿区", "渋谷区", "世田谷区",
  "横浜市", "名古屋市", "大阪市", "福岡市", "札幌市",
];

const venueNames = [
  "幕張メッセ", "東京ビッグサイト", "インテックス大阪",
  "ポートメッセなごや", "パシフィコ横浜",
];

const eventNameTemplates = [
  "痛車フェス {n}", "痛車ミーティング {n}", "痛車祭 {n}",
  "痛車ショー {n}", "痛車ナイト {n}",
];

const descriptionTemplates = [
  "最新の痛車デザインが集まるイベントです。エントリーは先着順です。",
  "遠征・併せ歓迎 of ミーティング形式。撮影エリアあり。",
  "初心者から上級者まで参加可能な交流イベントです。",
  "展示と物販を中心とした大規模フェス。駐車場は事前予約推奨。",
];

const approvalStatuses = ["DRAFT", "PENDING", "APPROVED"] as const;

function randomElement<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function truncateDescription(text: string): string {
  if (text.length <= EVENT_DESCRIPTION_MAX_CHARS) return text;
  return text.slice(0, EVENT_DESCRIPTION_MAX_CHARS - 1) + "…";
}

function randomFutureDate(daysFromNow: number, daysRange: number): Date {
  const now = new Date();
  const days = daysFromNow + Math.floor(Math.random() * daysRange);
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

export type CreateSampleEventsParams = {
  count: number;
  createdByUserId: string;
  nameNumberStart: number;
};

/**
 * シードや一括投入用: イベントと第1エントリー枠を `count` 件作成する。
 */
export async function createSampleEventsWithEntries(
  drizzleDb: any,
  params: CreateSampleEventsParams
): Promise<string[]> {
  const { count, createdByUserId, nameNumberStart } = params;
  const createdEventIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const n = nameNumberStart + i;
    const name = randomElement(eventNameTemplates).replace("{n}", String(n));
    const eventDate = randomFutureDate(7, 400);
    const entryStartAt = new Date(eventDate);
    entryStartAt.setDate(entryStartAt.getDate() - 21);
    const paymentDueAt = new Date(eventDate);
    paymentDueAt.setDate(paymentDueAt.getDate() - 7);

    const eventId = crypto.randomUUID();
    const description = truncateDescription(randomElement(descriptionTemplates));

    // events テーブルに挿入
    await drizzleDb.insert(events).values({
      id: eventId,
      name,
      description,
      eventDate: eventDate.toISOString(), // ISO 8601 string for SQLite
      approvalStatus: randomElement([...approvalStatuses]),
      prefecture: randomElement(prefectures),
      city: randomElement(cities),
      venueName: Math.random() > 0.25 ? randomElement(venueNames) : null,
      postalCode:
        Math.random() > 0.35 ? `${100 + Math.floor(Math.random() * 800)}-${1000 + Math.floor(Math.random() * 9000)}` : null,
      streetAddress:
        Math.random() > 0.3 ? `${1 + Math.floor(Math.random() * 4)}丁目${1 + Math.floor(Math.random() * 15)}番` : null,
      officialUrls: JSON.stringify([]),
      keywords: JSON.stringify(["痛車", "イベント"]),
      createdByUserId,
      entrySelectionMethod: "FIRST_COME",
      maxParticipants: Math.random() > 0.5 ? 50 + Math.floor(Math.random() * 200) : null,
      isMultiDay: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // eventEntries テーブルに挿入
    await drizzleDb.insert(eventEntries).values({
      id: crypto.randomUUID(),
      eventId,
      entryNumber: 1,
      entryStartAt: entryStartAt.toISOString(),
      entryDeadlineAt: new Date(eventDate.getTime() - 86400000 * 3).toISOString(),
      paymentDueAt: paymentDueAt.toISOString(),
      paymentDueType: "ABSOLUTE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    createdEventIds.push(eventId);
  }

  return createdEventIds;
}

export function sampleEventNameNumberStartForBulkAppend(): number {
  return Math.floor(Date.now() / 1000);
}
