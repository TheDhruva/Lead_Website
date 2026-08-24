"use client";

import { useEffect } from "react";

import { useTheme } from "next-themes";

const FAVICON_LIGHT = "/favicon-light.svg";
const FAVICON_DARK = "/favicon-dark.svg";

/** Keeps favicon in sync with resolved theme (system + in-app toggle). */
export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const href = resolvedTheme === "dark" ? FAVICON_DARK : FAVICON_LIGHT;

    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][data-theme-favicon="true"]',
    );

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.dataset.themeFavicon = "true";
      document.head.appendChild(link);
    }

    if (link.href !== new URL(href, window.location.origin).href) {
      link.href = href;
    }
  }, [resolvedTheme]);

  return null;
}
