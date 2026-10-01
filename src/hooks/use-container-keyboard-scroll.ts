"use client";

import { useEffect } from "react";

import { getScrollContainer, scrollContainerTo } from "@/lib/scroll-container";

/**
 * Keyboard scrolling for the custom scroll container.
 *
 * The page scrolls inside #scroll-container (the window itself never
 * scrolls), so PageDown/PageUp/Home/End/Space/arrows only work natively
 * when focus is inside the container. When focus is on <body> (e.g. right
 * after load, or after clicking non-interactive content), mirror the
 * default window-scroll keys onto the container. Interactive targets
 * (inputs, buttons, links, Space-activatable controls) are left alone so
 * native activation behavior is never broken.
 */
export function useContainerKeyboardScroll() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      const container = getScrollContainer();
      if (!container) return;

      const viewport = container.clientHeight;
      let delta: number | null = null;
      let absolute: number | null = null;

      switch (event.key) {
        case "PageDown":
          delta = viewport;
          break;
        case "PageUp":
          delta = -viewport;
          break;
        case "Home":
          absolute = 0;
          break;
        case "End":
          absolute = container.scrollHeight;
          break;
        case "ArrowDown":
          delta = 64;
          break;
        case "ArrowUp":
          delta = -64;
          break;
        case " ":
          // Space activates focused buttons/links — only scroll when the
          // focused element has no activation behavior of its own.
          if (
            tag === "BUTTON" ||
            tag === "A" ||
            target?.getAttribute("role") === "button" ||
            target?.getAttribute("role") === "checkbox" ||
            target?.getAttribute("role") === "radio" ||
            target?.getAttribute("role") === "switch" ||
            target?.getAttribute("role") === "option"
          ) {
            return;
          }
          delta = event.shiftKey ? -viewport : viewport;
          break;
        default:
          return;
      }

      // If focus is already inside the container the browser scrolls it
      // natively — only take over when focus is outside (typically <body>).
      if (container.contains(target) && target !== container) return;

      event.preventDefault();
      // One consistent path: the authoritative container scroller with
      // short, native-feeling durations. This supersedes any in-flight
      // programmatic tween (newest input wins) without setting the
      // navigation flag — keys are manual travel, not destination nav.
      // Reduced-motion jumps instantly inside scrollContainerTo.
      if (absolute !== null) {
        scrollContainerTo(absolute, { behavior: "smooth", duration: 400 });
      } else if (delta !== null) {
        const lineStep = Math.abs(delta) <= 64;
        scrollContainerTo(container.scrollTop + delta, {
          behavior: "smooth",
          duration: lineStep ? 160 : 380,
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
