"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import {
  hashTargetsSection,
  subscribeLazySectionMount,
} from "@/lib/lazy-section-mount";
import { cn } from "@/lib/utils";

interface LazySectionProps {
  children: ReactNode;
  /** Section id to keep anchor/scroll targets valid while still hidden. */
  id?: string;
  /** Background class shared by the placeholder and the section. */
  className?: string;
  /** Height reserved for the placeholder before content mounts. */
  minHeight?: CSSProperties["minHeight"];
  /** Start loading this far before the section enters the viewport. */
  rootMargin?: string;
  /** Visual anchor ratio for scroll guidance while placeholder is mounted. */
  scrollAnchorRatio?: string;
  /** Server-renderable summary content visible to crawlers while the section is unmounted. */
  srContent?: ReactNode;
}

/**
 * Defers a below-the-fold section's content (and the JS chunk that renders it)
 * until the user scrolls near it. The placeholder keeps a matching background
 * and id so nav links, section-highlighting and layout stay stable, then the
 * real section is mounted once it is approaching the viewport.
 */
export function LazySection({
  children,
  id,
  className,
  minHeight = "min(66svh, 700px)",
  rootMargin = "0px 0px 600px 0px",
  scrollAnchorRatio,
  srContent,
}: LazySectionProps) {
  const [forceMount, setForceMount] = useState(false);
  const [supported] = useState(
    typeof window === "undefined" || "IntersectionObserver" in window,
  );
  const { ref, isInView } = useIntersectionObserver<HTMLElement>({
    threshold: 0,
    rootMargin,
    triggerOnce: true,
    useScrollContainerRoot: true,
  });

  useEffect(() => {
    if (!id) return;

    const mount = () => setForceMount(true);
    const unsubMount = subscribeLazySectionMount(id, mount);

    const onHashChange = () => {
      if (hashTargetsSection(id)) mount();
    };

    if (hashTargetsSection(id)) mount();

    window.addEventListener("hashchange", onHashChange);
    return () => {
      unsubMount();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [id]);

  const shouldMount = forceMount || isInView;

  const placeholder = (
    <section
      ref={ref}
      id={id}
      data-snap-frame
      data-scroll-anchor-ratio={scrollAnchorRatio}
      className={cn("min-h-0", className)}
      style={{ minHeight }}
      aria-hidden={srContent ? undefined : "true"}
      aria-busy="true"
      tabIndex={srContent ? undefined : -1}
    >
      {srContent ? <div className="sr-only">{srContent}</div> : null}
    </section>
  );

  if (!supported) {
    return srContent ? (
      placeholder
    ) : (
      <div className={className}>{children}</div>
    );
  }

  if (!shouldMount) {
    return placeholder;
  }

  const divRef = ref as RefObject<HTMLDivElement | null>;

  return (
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
}
