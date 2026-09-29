"use client";

import { useCallback, useEffect, useState } from "react";

import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { getScrollContainer } from "@/lib/scroll-container";

/**
 * Active nav section via a single IntersectionObserver on the snap panel.
 *
 * Lazy sections swap their placeholder node for the real section after
 * mounting, which silently detaches one-shot observers — so targets are
 * re-collected whenever #main-content mutates. State updates only when the
 * dominant section actually changes (never per frame).
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;

    const root = getScrollContainer();
    let observer: IntersectionObserver | null = null;
    const observed = new Set<Element>();

    const collect = () =>
      sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el));

    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          const top = visible[0];
          if (top?.target.id) {
            setActiveId((current) =>
              current === top.target.id ? current : top.target.id,
            );
          }
        },
        {
          root,
          rootMargin: "-35% 0px -45% 0px",
          threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        },
      );
      observed.clear();
      for (const el of collect()) {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      }
    };

    observe();

    // Re-collect only when a section NODE actually swaps (lazy placeholder
    // → real section keeps the same id, so compare node identity, not ids).
    let known = collect();
    const mutations = new MutationObserver(() => {
      const current = collect();
      const changed =
        current.length !== known.length ||
        current.some((el, i) => el !== known[i]);
      if (changed) {
        known = current;
        observe();
      }
    });
    mutations.observe(main, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer?.disconnect();
    };
  }, [sectionIds]);

  const scrollToSection = useCallback(
    (href: string) => {
      scrollTo(href);
    },
    [scrollTo],
  );

  return { activeId, scrollToSection };
}
