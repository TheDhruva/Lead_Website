"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { MagneticText } from "@/components/ui/magnetic-text";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MOTION, NAV_ITEMS, SECTION_IDS } from "@/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { useLenis } from "@/hooks/use-lenis";
import { cn } from "@/lib/utils";

const SECTION_LIST = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const { activeId, scrollToSection } = useActiveSection(SECTION_LIST);
  const lenis = useLenis();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const update = (scrollY: number) => {
      setScrolled(scrollY > 24);
    };

    if (lenis) {
      update(lenis.scroll);
      const onScroll = ({ scroll }: { scroll: number }) => update(scroll);
      lenis.on("scroll", onScroll);
      return () => {
        lenis.off("scroll", onScroll);
      };
    }

    const onWindowScroll = () => update(window.scrollY);
    onWindowScroll();
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [lenis]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen, closeMenu]);

  const handleNavClick = (href: string) => {
    scrollToSection(href);
    closeMenu();
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed left-1/2 z-50 flex w-[90%] max-w-container-max -translate-x-1/2 items-center justify-between rounded-full border border-border px-gutter shadow-2xl",
        "transition-[top,padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "max-md:bg-background max-md:backdrop-blur-none",
        "md:bg-nav",
        scrolled
          ? "top-4 py-2.5 md:backdrop-blur-2xl"
          : "top-6 py-4 md:backdrop-blur-xl",
      )}
    >
      <a
        href="#work"
        onClick={(event) => {
          event.preventDefault();
          handleNavClick("#work");
        }}
        className="font-display-lg text-display-lg-mobile tracking-tighter text-foreground transition-opacity duration-200 hover:opacity-80 md:text-display-lg"
      >
        <MagneticText text="DHRUVA" strength={9} radius={130} />
      </a>

      <div className="hidden items-center gap-8 md:flex">
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
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "font-label-md text-label-md transition-all duration-[250ms] ease-out hover:text-foreground",
                isActive
                  ? "border-b border-foreground pb-1 font-bold text-foreground"
                  : "font-medium text-foreground-secondary",
              )}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle className="hidden md:inline-flex" />
        <Magnetic className="hidden sm:inline-flex" strength={16} radius={160}>
          <Button size="md" onClick={() => handleNavClick("#contact")}>
            Hire Me
          </Button>
        </Magnetic>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-border p-2 text-foreground transition-all duration-[250ms] hover:bg-card-hover active:scale-[0.985] motion-reduce:active:scale-100 md:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: MOTION.hover.ease }}
            className="absolute top-[calc(100%+12px)] right-0 left-0 rounded-2xl border border-border bg-background p-6 shadow-2xl md:hidden"
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
  );
}
