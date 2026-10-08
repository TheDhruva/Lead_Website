"use client";

import { m } from "framer-motion";

import { NAV_ITEMS, SECTION_ORDER } from "@/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfxHandlers } from "@/hooks/use-sfx-handlers";
import { cn } from "@/lib/utils";

/**
 * Floating bottom section nav — desktop only (lg: and up, same threshold
 * as the Hero/Services/Video/Projects desktop compositions).
 * Mobile AND tablet navigate via the top bar menu sheet, so the
 * 768–1023px band speaks one mobile design language.
 * Compact pill, Lacquer active state, Manrope uppercase.
 * (Section-snap audio lives in the top Navbar.)
 */
export function FloatingNav() {
  const { displayId, scrollToSection } = useActiveSection(SECTION_ORDER);
  const { play } = useSfxHandlers();
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 hidden w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 lg:block"
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full border border-border bg-paper p-1.5 shadow-[var(--shadow-md)]",
          "dark:bg-ink",
        )}
      >
        {/* NOTE: no compact narrow-viewport variant — this nav renders
            only at `lg:` and up, so below-lg rules would be dead code. */}
        <ul className="flex max-w-full items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const id = item.href.replace("#", "");
            const isActive = displayId === id;

            return (
              <li key={item.href} className="shrink-0">
                <a
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    // One quiet tick per user-activated navigation.
                    play("nav-click");
                    scrollToSection(item.href);
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 font-sans text-[11px] font-semibold tracking-[0.18em] whitespace-nowrap uppercase transition-colors duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "motion-reduce:transition-none",
                    isActive
                      ? "text-paper"
                      : "bg-transparent text-muted-foreground hover:bg-card-hover hover:text-foreground",
                  )}
                >
                  {/* One coherent indicator: a shared layout pill that
                      glides between items (tween, never spring). The
                      pill is absolutely positioned, so item geometry
                      — and the navbar itself — never shifts. */}
                  {isActive ? (
                    prefersReducedMotion ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-lacquer shadow-[var(--shadow-sm)] dark:bg-bright-lacquer"
                      />
                    ) : (
                      <m.span
                        aria-hidden
                        layoutId="floating-nav-active-pill"
                        transition={{
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute inset-0 rounded-full bg-lacquer shadow-[var(--shadow-sm)] dark:bg-bright-lacquer"
                      />
                    )
                  ) : null}
                  <span className="relative">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
