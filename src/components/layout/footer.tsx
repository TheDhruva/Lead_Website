"use client";

import { Container } from "@/components/ui/container";
import { MagneticText } from "@/components/ui/magnetic-text";
import { footerLinks } from "@/data";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  className?: string;
  variant?: "light" | "dark";
  /** Skip inner Container — use when footer sits inside a parent Container */
  embedded?: boolean;
}

export function SiteFooter({
  className,
  variant = "light",
  embedded = false,
}: SiteFooterProps) {
  const isDark = variant === "dark";

  const content = (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span
          className={cn(
            "font-label-md text-sm font-semibold tracking-[0.12em] uppercase",
            isDark ? "text-white" : "text-foreground",
          )}
        >
          <MagneticText text="DHRUVA" strength={7} radius={100} />
        </span>
        <span className="font-body-md text-sm">© 2026</span>
      </div>

      <nav
        aria-label="Footer social links"
        className="flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        {footerLinks.map((link) => {
          const isExternal = link.href.startsWith("http");
          const isResume = link.id === "resume";

          return (
            <a
              key={link.id}
              href={link.href}
              target={isExternal || isResume ? "_blank" : undefined}
              rel={isExternal || isResume ? "noopener noreferrer" : undefined}
              data-cursor="link"
              className={cn(
                "font-body-md text-sm transition-colors duration-[250ms]",
                isDark
                  ? "text-white/65 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
                "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    </>
  );

  return (
    <footer
      className={cn(
        "w-full",
        !embedded && "border-t pt-8 md:pt-10",
        isDark
          ? "border-white/10 text-white/70"
          : "border-divider text-muted-foreground",
        className,
      )}
    >
      {embedded ? (
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center sm:gap-8">
          {content}
        </div>
      ) : (
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center sm:gap-8">
          {content}
        </Container>
      )}
    </footer>
  );
}

/** @deprecated Use SiteFooter inside Contact section */
export function Footer() {
  return (
    <div className="bg-background-secondary">
      <SiteFooter className="px-gutter pb-8 md:pb-10" />
    </div>
  );
}
