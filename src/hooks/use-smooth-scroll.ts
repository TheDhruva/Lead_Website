"use client";

import { useCallback } from "react";

import { scrollToSectionElement } from "@/lib/scroll-position";

export function useSmoothScroll() {
  const scrollTo = useCallback((hrefOrId: string) => {
    const id = hrefOrId.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    scrollToSectionElement(target);
  }, []);

  return { scrollTo };
}
