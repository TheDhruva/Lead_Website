import type { MetadataRoute } from "next";

import { siteConfig } from "@/data";

export default function sitemap(): MetadataRoute.Sitemap {
  // No lastModified: a static single-page portfolio has no meaningful
  // per-request content timestamp, and emitting `new Date()` here made
  // the sitemap appear freshly modified on every request (uncacheable).
  return [
    {
      url: siteConfig.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
