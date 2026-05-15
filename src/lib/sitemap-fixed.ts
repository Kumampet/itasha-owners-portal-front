import { getMetadataBase } from "@/lib/metadata";
import {
  buildUrlsetXml,
  type SitemapUrlEntry,
} from "@/lib/sitemap-xml";

/** 固定ページのパス（旧 src/app/sitemap.ts と同一） */
export const FIXED_SITEMAP_PATHS: readonly string[] = [
  "/",
  "/about",
  "/events",
  "/term",
  "/privacy",
  "/app/auth",
  "/app/contact",
  "/app/event-submission",
];

export function buildFixedSitemapXml(): string {
  const origin = getMetadataBase().origin;
  const now = new Date().toISOString();

  const entries: SitemapUrlEntry[] = FIXED_SITEMAP_PATHS.map((path) => ({
    loc: `${origin}${path}`,
    lastmod: now,
    changefreq: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? "1.0" : "0.7",
  }));

  return buildUrlsetXml(entries);
}
