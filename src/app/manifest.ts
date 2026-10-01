import type { MetadataRoute } from "next";

import { siteConfig } from "@/data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Cinematic Digital Studio`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    // Coherent with the default (light) theme — see themeColor in layout
    // viewport config (#faf7f0 light / #171211 dark).
    background_color: "#faf7f0",
    theme_color: "#faf7f0",
    icons: [
      { src: "/favicon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
