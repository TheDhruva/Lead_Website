import type { MetadataRoute } from "next";

import { siteConfig } from "@/data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Cinematic Digital Studio`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e0e",
    theme_color: "#0e0e0e",
    icons: [
      { src: "/favicon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
