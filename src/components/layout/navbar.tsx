"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ArrowUpRight, Menu, X } from "lucide-react";

import { SectionSnapSound } from "@/components/audio/section-snap-sound";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NAV_ITEMS, SECTION_IDS } from "@/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { useNavMetrics } from "@/hooks/use-nav-metrics";
import { useSfxHandlers } from "@/hooks/use-sfx-handlers";
import { lockScrollPanel, unlockScrollPanel } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";

const SECTION_LIST = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

/**
 * Minimal editorial top navigation — a transparent bar attached edge to
 * edge at the very top (macOS menu-bar style). It scrolls away with the
 * page: no fixed positioning, no background, no border, no shadow.
 * Section links live in the mobile menu sheet; desktop uses CTAs.
 */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { activeId, scrollToSection } = useActiveSection(SECTION_LIST);
  const { onHover, onClick } = useSfxHandlers();

  useNavMetrics(navRef);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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

  const go = (href: string) => {
    onClick();
    scrollToSection(href);
    closeMenu();
  };

  return (
    <>
      <SectionSnapSound activeId={activeId} />
      <nav
        ref={navRef}
        aria-label="Primary"
        className="navbar absolute top-0 right-0 left-0 z-50"
      >
        <div className="relative z-10 mx-auto flex h-10 w-full items-center justify-between gap-3 px-4 sm:px-5 md:h-12 md:px-8">
          {/* LEFT — wordmark */}
          <a
            href="#work"
            onClick={(event) => {
              event.preventDefault();
              go("#work");
            }}
            className="shrink-0 rounded-sm font-sans text-[13px] font-bold tracking-[0.22em] text-foreground uppercase transition-opacity duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            aria-label="THE DHRUVA — back to top"
          >
            The&nbsp;Dhruva
          </a>

          {/* RIGHT — controls */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => go("#contact")}
              className="group shrink-0"
              aria-label="Hire Me — go to contact"
            >
              <span className="max-sm:hidden">Hire Me</span>
              <span className="sm:hidden">Hire</span>
              <ArrowUpRight
                aria-hidden="true"
                className="transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[2px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
              />
            </Button>
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
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
                <X className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu sheet — simple overlay, no animation system */}
        {menuOpen ? (
          <div className="fixed inset-0 z-0 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMenu}
              className="absolute inset-0 cursor-default bg-overlay"
            />
            <div
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="nav-menu-panel absolute top-0 right-0 left-0 border-b border-border bg-background px-5 pt-12 pb-6"
            >
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item) => {
                  const id = item.href.replace("#", "");
                  const isActive = activeId === id;

                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={(event) => {
                          event.preventDefault();
                          go(item.href);
                        }}
                        onMouseEnter={onHover}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "flex items-center justify-between border-b border-divider py-3 font-sans text-sm font-semibold tracking-[0.14em] uppercase transition-colors duration-200 last:border-b-0 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "text-lacquer dark:text-bright-lacquer"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isActive
                              ? "bg-lacquer dark:bg-bright-lacquer"
                              : "bg-transparent",
                          )}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
