"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";

import { SectionSnapSound } from "@/components/audio/section-snap-sound";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { MagneticText } from "@/components/ui/magnetic-text";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MOTION, NAV_ITEMS, SECTION_IDS } from "@/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { useLenis } from "@/hooks/use-lenis";
import { useNavMetrics } from "@/hooks/use-nav-metrics";
import { useSfxHandlers } from "@/hooks/use-sfx-handlers";
import { getScrollContainer, getScrollTop } from "@/lib/scroll-container";
import { lockScrollPanel, unlockScrollPanel } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";

const SECTION_LIST = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

const SCROLL_THRESHOLD = 24;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const scrolledRef = useRef(false);
  const { activeId, scrollToSection } = useActiveSection(SECTION_LIST);
  const lenis = useLenis();
  const { onHover, onClick, onCursor } = useSfxHandlers();

  useNavMetrics(navRef);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const applyScrolled = (scrollY: number) => {
      const next = scrollY > SCROLL_THRESHOLD;
      if (scrolledRef.current === next) return;
      scrolledRef.current = next;
      nav.dataset.scrolled = next ? "true" : "false";
      requestAnimationFrame(() => {
        const rect = nav.getBoundingClientRect();
        const safeTop = rect.top + rect.height + 20;
        document.documentElement.style.setProperty(
          "--nav-height",
          `${rect.height}px`,
        );
        document.documentElement.style.setProperty(
          "--nav-offset",
          `${rect.top}px`,
        );
        document.documentElement.style.setProperty(
          "--nav-safe-top",
          `${safeTop}px`,
        );
      });
    };

    const container = getScrollContainer();
    const onScroll = () => applyScrolled(getScrollTop());
    onScroll();

    if (lenis) {
      lenis.on("scroll", onScroll);
      return () => {
        lenis.off("scroll", onScroll);
      };
    }

    container?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container?.removeEventListener("scroll", onScroll);
    };
  }, [lenis]);

  useEffect(() => {
    if (!menuOpen) return;

    lockScrollPanel();

    const menu = document.getElementById(menuId);
    const focusable = menu
      ? Array.from(
          menu.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const trigger = menuButtonRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScrollPanel();
      trigger?.focus();
    };
  }, [menuOpen, closeMenu, menuId]);

  const handleNavClick = (href: string) => {
    onClick();
    scrollToSection(href);
    closeMenu();
  };

  return (
    <>
      <SectionSnapSound activeId={activeId} />
      <AnimatePresence>
        {menuOpen ? (
          <m.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
        ) : null}
      </AnimatePresence>

      <nav
        ref={navRef}
        aria-label="Primary"
        data-scrolled="false"
        className={cn(
          "navbar fixed left-1/2 z-50 flex w-[min(92%,1480px)] max-w-container-max -translate-x-1/2 items-center justify-between rounded-full border px-4 sm:px-gutter",
          "transition-[top,padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "top-4 py-2 md:py-2.5 md:backdrop-blur-xl",
          "max-md:border-border/80 max-md:bg-background/95 max-md:shadow-[0_8px_28px_rgb(0_0_0/0.07)]",
          "md:border-border/55 md:bg-nav/88 md:shadow-[0_8px_32px_rgb(0_0_0/0.05)]",
        )}
      >
        <a
          href="#work"
          onClick={(event) => {
            event.preventDefault();
            handleNavClick("#work");
          }}
          onMouseEnter={onCursor}
          className="shrink-0 font-display-lg text-[1.35rem] leading-none font-extrabold tracking-[-0.04em] text-foreground transition-opacity duration-200 hover:opacity-80 sm:text-[1.5rem] md:text-[1.65rem]"
        >
          <MagneticText text="DHRUVA" strength={7} radius={120} />
        </a>

        <div className="relative hidden items-center gap-6 md:flex lg:gap-8">
          {NAV_ITEMS.map((item) => {
            const id = item.href.replace("#", "");
            const isActive = activeId === id;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick(item.href);
                }}
                onMouseEnter={onHover}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative py-1 font-label-md text-label-md transition-colors duration-[250ms] ease-out hover:text-foreground",
                  isActive
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground-secondary",
                )}
              >
                {item.label}
                {isActive ? (
                  <m.span
                    layoutId="nav-active-indicator"
                    className="absolute right-0 -bottom-1 left-0 mx-auto h-px w-full max-w-[calc(100%-0.5rem)] bg-[var(--accent-cherry)]"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden md:inline-flex" />
          <Magnetic
            className="hidden sm:inline-flex"
            strength={10}
            radius={140}
          >
            <Button size="md" onClick={() => handleNavClick("#contact")}>
              Hire Me
            </Button>
          </Magnetic>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-border p-2 text-foreground transition-all duration-[250ms] hover:bg-card-hover active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => {
              onClick();
              setMenuOpen((open) => !open);
            }}
            onMouseEnter={onHover}
          >
            {menuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" strokeWidth={2} />
            )}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <m.div
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: MOTION.hover.ease }}
              className="absolute top-[calc(100%+12px)] right-0 left-0 z-10 rounded-2xl border border-border bg-background p-6 shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-4">
                {NAV_ITEMS.map((item) => {
                  const id = item.href.replace("#", "");
                  const isActive = activeId === id;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        handleNavClick(item.href);
                      }}
                      onMouseEnter={onHover}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "font-label-md text-label-md py-2 transition-colors duration-[250ms]",
                        isActive
                          ? "font-bold text-foreground"
                          : "text-foreground-secondary",
                      )}
                    >
                      {item.label}
                    </a>
                  );
                })}
                <ThemeToggle variant="full" />
                <Button
                  size="md"
                  fullWidth
                  onClick={() => handleNavClick("#contact")}
                >
                  Hire Me
                </Button>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </>
  );
}
