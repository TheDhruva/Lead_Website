"use client";

import { Container } from "@/components/ui/container";
import { MagneticText } from "@/components/ui/magnetic-text";
import { footerLinks } from "@/data";

export function Footer() {
  return (
    <footer className="w-full border-t border-divider bg-background-secondary">
      <Container className="flex flex-col items-start justify-between gap-6 px-gutter py-8 sm:flex-row sm:items-center sm:gap-8 md:py-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-label-md text-sm font-semibold tracking-[0.12em] text-foreground uppercase">
            <MagneticText text="DHRUVA" strength={7} radius={100} />
          </span>
          <span className="font-body-md text-sm text-muted-foreground">
            © 2026
          </span>
        </div>

        <nav
          aria-label="Footer social links"
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          {footerLinks.map((link) => {
            const isExternal = link.href.startsWith("http");

            return (
              <a
                key={link.id}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="font-body-md text-sm text-muted-foreground transition-colors duration-[250ms] hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </Container>
    </footer>
  );
}
