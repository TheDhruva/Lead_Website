"use client";

import { type ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Renders page content fully visible from the very first paint.
 *
 * The page used to render at `opacity: 0` and only fade in after the JS
 * bundle hydrated and the intro timer fired — so users on slow connections
 * saw a blank screen (or a soft-failed load) until ~300KB of JS had loaded.
 *
 * The intro overlay is the only hidden layer: it is client-only and covers
 * the whole viewport during the first visit, so no opacity gate is needed
 * here. If JS is slow or never loads, the site is still readable.
 */
function PageTransitionComponent({ children, className }: PageTransitionProps) {
  return <div className={className}>{children}</div>;
}

export const PageTransition = memo(PageTransitionComponent);
