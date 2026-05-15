import { NextResponse } from "next/server";
import { getMetadataBase } from "@/lib/metadata";
import { getEventsSitemapIndexLoc } from "@/lib/events-sitemap-s3";
import { buildSitemapIndexXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/**
 * サイト全体のサイトマップ索引。固定ページは sitemap-fixed.xml、
 * イベント詳細 urlset はアプリ配下の /api/events-sitemap.xml（サイトマップ用 S3 バケットから取得）。
 * CDN 等で別 URL を載せる場合は EVENTS_SITEMAP_PUBLIC_URL を設定する。
 */
export async function GET() {
  const origin = getMetadataBase().origin.replace(/\/$/, "");
  const now = new Date().toISOString();

  const fixedSitemapUrl = `${origin}/sitemap-fixed.xml`;
  const eventsPublic =
    process.env.EVENTS_SITEMAP_PUBLIC_URL?.trim() || getEventsSitemapIndexLoc();

  const indexEntries = [
    { loc: fixedSitemapUrl, lastmod: now },
    { loc: eventsPublic, lastmod: now },
  ];

  const xml = buildSitemapIndexXml(indexEntries);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
