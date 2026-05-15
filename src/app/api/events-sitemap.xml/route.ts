import { NextResponse } from "next/server";
import { getPublicEventsUrlsetXml } from "@/lib/events-sitemap-s3";
import { buildUrlsetXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/**
 * イベント詳細の urlset を公開する。
 * 本番既定: EVENTS_SITEMAP_BUCKET 上のオブジェクト。
 * next dev のローカル束ねモードでは、DATABASE_URL の承認済みイベントだけで構成（S3 は未参照）。
 */
export async function GET() {
  try {
    const body = await getPublicEventsUrlsetXml();
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("[events-sitemap] GET /api/events-sitemap.xml failed:", e);
    return new NextResponse(buildUrlsetXml([]), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60",
      },
    });
  }
}
