import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getMetadataBase().origin;
  const now = new Date();

  const paths = [
    "/",
    "/events",
    "/term",
    "/privacy-policy",
    "/app/auth",
    "/app/contact",
    "/app/event-submission",
  ];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
