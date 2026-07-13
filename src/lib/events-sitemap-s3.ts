// import fs from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getMetadataBase } from "@/lib/metadata";
import {
  buildUrlsetXml,
  parseUrlsetLocToLastmod,
  type SitemapUrlEntry,
} from "@/lib/sitemap-xml";
import { prisma } from "@/lib/prisma";
import {
  getLocalBundledStorageRoot,
  isLocalBundledStorageEnabled,
} from "@/lib/local-storage-mode";

/** サイトマップ専用バケット（画像バケットとは別） */
const DEFAULT_EVENTS_SITEMAP_BUCKET = "itasha-owners-portal-sitemap-production";
const DEFAULT_EVENTS_SITEMAP_S3_KEY = "events-sitemap.xml";

function getEventsSitemapBucket(): string {
  return (
    process.env.EVENTS_SITEMAP_BUCKET?.trim() || DEFAULT_EVENTS_SITEMAP_BUCKET
  );
}

function getEventsSitemapObjectKey(): string {
  return (
    process.env.EVENTS_SITEMAP_S3_KEY?.trim() || DEFAULT_EVENTS_SITEMAP_S3_KEY
  );
}

/**
 * サイトマップ専用バケットへの接続。
 * EVENTS_SITEMAP_AWS_* でキーを指定、省略時は IAM ロール等のデフォルト認証チェーン。
 */
function getEventsSitemapS3Client(): S3Client {
  const region =
    process.env.EVENTS_SITEMAP_AWS_REGION?.trim() ||
    process.env.APP_AWS_REGION ||
    "ap-northeast-1";

  const accessKeyId = process.env.EVENTS_SITEMAP_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.EVENTS_SITEMAP_AWS_SECRET_ACCESS_KEY?.trim();

  return new S3Client({
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  });
}

function isNoSuchKeyError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as { name: string }).name === "NoSuchKey"
  );
}

function getPublicSiteOrigin(): string {
  return getMetadataBase().origin;
}

export function eventDetailPublicUrl(eventId: string): string {
  const origin = getPublicSiteOrigin().replace(/\/$/, "");
  return `${origin}/events/${eventId}`;
}

/** next dev 等、ローカル束ねモードでは S3 に触れずローカルの DB で urlset を都度構成する */
export function isDatabaseBackedEventsSitemapEnabled(): boolean {
  return isLocalBundledStorageEnabled();
}

export async function buildApprovedEventsSitemapXmlFromDatabase(): Promise<string> {
  const events = await prisma.event.findMany({
    where: { approval_status: "APPROVED" },
    select: { id: true, updated_at: true },
    orderBy: { updated_at: "asc" },
  });
  const entries: SitemapUrlEntry[] = events.map((e) => ({
    loc: eventDetailPublicUrl(e.id),
    lastmod: e.updated_at.toISOString(),
  }));
  return buildUrlsetXml(entries);
}

/** 公開 API から呼ぶイベント urlset の本文（モードにより S3 または DB）。 */
export async function getPublicEventsUrlsetXml(): Promise<string> {
  if (isDatabaseBackedEventsSitemapEnabled()) {
    return buildApprovedEventsSitemapXmlFromDatabase();
  }
  const xml = await readEventsSitemapFromS3();
  return xml ?? buildUrlsetXml([]);
}

/**
 * ローカル用に events-sitemap.xml をダンプ（クローラ公開は `/api/events-sitemap.xml` で DB を参照）。
 */
async function writeLocalEventsSitemapSnapshotFile(xml: string): Promise<void> {
  const root = getLocalBundledStorageRoot();
  // await fs.mkdir(root, { recursive: true });
  // await fs.writeFile(
  //   path.join(root, DEFAULT_EVENTS_SITEMAP_S3_KEY),
  //   xml,
  //   "utf8",
  // );
}

/**
 * サイトマップ索引に載せる、イベント用 urlset のクローラ向け URL。
 * 画像と同様にアプリドメイン配下（S3 直 URL は使わない）。
 * EVENTS_SITEMAP_PUBLIC_URL で上書き可能（CDN 等）。
 */
export function getEventsSitemapIndexLoc(): string {
  const origin = getPublicSiteOrigin().replace(/\/$/, "");
  return `${origin}/api/events-sitemap.xml`;
}

export async function readEventsSitemapFromS3(): Promise<string | null> {
  const client = getEventsSitemapS3Client();
  const Bucket = getEventsSitemapBucket();
  const Key = getEventsSitemapObjectKey();

  try {
    const out = await client.send(new GetObjectCommand({ Bucket, Key }));
    const body = out.Body;
    if (!body) return null;
    return await body.transformToString();
  } catch (e) {
    if (isNoSuchKeyError(e)) return null;
    throw e;
  }
}

export async function writeEventsSitemapXmlToS3(xml: string): Promise<void> {
  const client = getEventsSitemapS3Client();
  const Bucket = getEventsSitemapBucket();
  const Key = getEventsSitemapObjectKey();

  const useSse =
    process.env.EVENTS_SITEMAP_SSE_AES256?.trim().toLowerCase() === "true";

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: xml,
      ContentType: "application/xml; charset=utf-8",
      CacheControl: "public, max-age=3600",
      ...(useSse ? { ServerSideEncryption: "AES256" as const } : {}),
    }),
  );
}

/**
 * 承認済みイベント 1 件を S3 上の events-sitemap.xml に追記または lastmod 更新する。
 * オブジェクトが無い場合は新規作成する。
 */
export async function mergeOneApprovedEventIntoSitemapOnS3(
  eventId: string,
  lastModified: Date,
): Promise<void> {
  if (isDatabaseBackedEventsSitemapEnabled()) {
    try {
      const xml = await buildApprovedEventsSitemapXmlFromDatabase();
      await writeLocalEventsSitemapSnapshotFile(xml);
    } catch (e) {
      console.warn(
        "[events-sitemap] local snapshot refresh skipped:",
        eventId,
        e,
      );
    }
    return;
  }

  const loc = eventDetailPublicUrl(eventId);
  const lastmod = lastModified.toISOString();

  let existing: string | null = null;
  try {
    existing = await readEventsSitemapFromS3();
  } catch (e) {
    console.error(
      "[events-sitemap] Failed to read existing sitemap from S3:",
      e,
    );
    throw e;
  }

  const map =
    existing && existing.includes("<url")
      ? parseUrlsetLocToLastmod(existing)
      : new Map<string, string>();

  map.set(loc, lastmod);

  const entries: SitemapUrlEntry[] = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([urlLoc, lm]) => ({
      loc: urlLoc,
      lastmod: lm || lastmod,
    }));

  const xml = buildUrlsetXml(entries);

  try {
    await writeEventsSitemapXmlToS3(xml);
  } catch (e) {
    console.error("[events-sitemap] Failed to write sitemap to S3:", e);
    throw e;
  }
}

/** スポット同期: 承認済みイベント一覧で urlset を全置換する */
export async function replaceEventsSitemapWithUrls(
  urls: { loc: string; lastmod: string }[],
): Promise<void> {
  const entries: SitemapUrlEntry[] = [...urls]
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map((u) => ({ loc: u.loc, lastmod: u.lastmod }));

  const xml = buildUrlsetXml(entries);
  await writeEventsSitemapXmlToS3(xml);
}

export async function syncApprovedEventsSitemapFromDbEvents(
  events: { id: string; updated_at: Date }[],
): Promise<void> {
  const merged = events.map((e) => ({
    loc: eventDetailPublicUrl(e.id),
    lastmod: e.updated_at.toISOString(),
  }));
  if (isDatabaseBackedEventsSitemapEnabled()) {
    const entries: SitemapUrlEntry[] = [...merged]
      .sort((a, b) => a.loc.localeCompare(b.loc))
      .map((u) => ({ loc: u.loc, lastmod: u.lastmod }));
    const xml = buildUrlsetXml(entries);
    await writeLocalEventsSitemapSnapshotFile(xml);
    console.log(
      `[events-sitemap] ローカルモード: 承認済み ${merged.length} 件を DB 構成で local-storage/${DEFAULT_EVENTS_SITEMAP_S3_KEY} に書き込み済み`,
    );
    return;
  }
  await replaceEventsSitemapWithUrls(merged);
}

/**
 * API レスポンスを落とさないよう承認フローから呼ぶラッパー。
 */
export function scheduleMergeApprovedEventIntoSitemapOnS3(
  eventId: string,
  lastModified: Date,
): void {
  void mergeOneApprovedEventIntoSitemapOnS3(eventId, lastModified).catch(
    (err) => {
      console.error(
        "[events-sitemap] mergeOneApprovedEventIntoSitemapOnS3 failed:",
        err,
      );
    },
  );
}
