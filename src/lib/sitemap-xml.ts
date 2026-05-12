/** sitemap.org の XML 生成・簡易パース */

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export type SitemapUrlEntry = {
  loc: string;
  lastmod: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
};

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((e) => {
      let block = `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>`;
      if (e.changefreq) {
        block += `
    <changefreq>${e.changefreq}</changefreq>`;
      }
      if (e.priority !== undefined) {
        block += `
    <priority>${escapeXml(e.priority)}</priority>`;
      }
      block += `
  </url>`;
      return block;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${SITEMAP_NS}">
${body}
</urlset>`;
}

export type SitemapIndexEntry = {
  loc: string;
  lastmod: string;
};

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map(
      (e) => `  <sitemap>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${SITEMAP_NS}">
${body}
</sitemapindex>`;
}

/** 既存 urlset の &lt;loc&gt; をキーに lastmod を復元する（マージ用） */
export function parseUrlsetLocToLastmod(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const urlBlocks = xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g);
  for (const m of urlBlocks) {
    const block = m[1] ?? "";
    const locMatch = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/);
    if (!locMatch?.[1]) continue;
    const loc = locMatch[1].trim();
    const lmMatch = block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/);
    map.set(loc, (lmMatch?.[1] ?? "").trim());
  }
  return map;
}
