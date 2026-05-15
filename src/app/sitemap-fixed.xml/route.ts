import { NextResponse } from "next/server";
import { buildFixedSitemapXml } from "@/lib/sitemap-fixed";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = buildFixedSitemapXml();
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
