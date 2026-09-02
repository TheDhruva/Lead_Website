"use client";

import { useEffect, useRef, useState } from "react";

import { getScrollContainer } from "@/lib/scroll-container";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  root?: Element | null;
  /** Observe visibility within the main scroll panel (Lenis / mobile). */
  useScrollContainerRoot?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
) {
  const {
    threshold = 0,
    rootMargin = "0px",
    triggerOnce = true,
    root = null,
    useScrollContainerRoot = false,
  } = options;
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const scrollRoot = useScrollContainerRoot ? getScrollContainer() : root;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin, root: scrollRoot ?? null },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, root, useScrollContainerRoot]);

  return { ref, isInView };
}
