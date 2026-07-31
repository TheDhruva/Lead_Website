"use client";

import { useCallback } from "react";

import { NAV_SCROLL_OFFSET } from "@/constants";
import { useLenis } from "@/hooks/use-lenis";

export function useSmoothScroll() {
  const lenis = useLenis();

  const scrollTo = useCallback(
    (hrefOrId: string) => {
      const id = hrefOrId.replace("#", "");
      const target = document.getElementById(id);
      if (!target) return;

      if (lenis) {
        lenis.scrollTo(target, {
          offset: NAV_SCROLL_OFFSET,
          duration: 1.15,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
        return;
      }

      const top =
        target.getBoundingClientRect().top + window.scrollY + NAV_SCROLL_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [lenis],
  );

  return { scrollTo };
}
