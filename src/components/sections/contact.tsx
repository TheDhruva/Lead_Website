"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

import { FileText } from "lucide-react";

import { Reveal } from "@/components/animations/reveal";
import { SiteFooter } from "@/components/layout/footer";
import { ContactFormSkeleton } from "@/components/ui/contact-form-skeleton";
import { Container } from "@/components/ui/container";
import { SocialIcon } from "@/components/ui/social-icon";
import { resumeLink, socialLinks } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

const ContactForm = dynamic(
  () => import("./contact-form").then((mod) => mod.ContactForm),
  { ssr: false },
);

function ContactFormLazy() {
  const { ref, isInView } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0,
    rootMargin: "200px 0px",
    triggerOnce: true,
  });

  return (
    <div ref={ref} className="min-h-0">
      {isInView ? <ContactForm /> : <ContactFormSkeleton />}
    </div>
  );
}

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  useCinematicSection(sectionRef, "contact");

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-snap-frame
      data-scroll-anchor-ratio="0.42"
      className="section-contact section-tone-contact contact-scene"
      aria-labelledby="contact-heading"
    >
      <Container className="contact-scene__body flex w-full min-w-0 max-w-none flex-col gap-5 md:max-h-full md:gap-3 lg:gap-4">
        <div
          data-scroll-anchor
          className="contact-scene__main grid min-h-0 min-w-0 flex-1 grid-cols-1 items-start gap-4 max-md:gap-3.5 md:items-center md:gap-0"
        >
          <Reveal className="contact-scene__intro cinematic-layer cinematic-layer--links flex min-w-0 flex-col gap-4 max-md:gap-3 md:gap-4">
            <h2
              id="contact-heading"
              className="contact-scene__heading cinematic-layer cinematic-layer--heading font-headline-xl font-extrabold text-foreground"
            >
              <span className="contact-scene__heading-line block">
                Your Brand Deserves
              </span>
              <span className="contact-scene__heading-line block">
                More Than Another
              </span>
              <span className="contact-scene__heading-line contact-scene__heading-line--accent block">
                Template.
              </span>
            </h2>

            <div className="flex flex-col gap-3 max-md:gap-2 md:gap-3">
              <a
                href={resumeLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-scene__resume-desktop group hidden min-h-11 w-fit items-center gap-3 text-foreground-secondary transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:text-foreground active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:inline-flex"
              >
                <FileText
                  className="h-[18px] w-[18px] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <span className="font-label-md text-label-md tracking-wide">
                  View {resumeLink.label}
                </span>
              </a>
            </div>

            <nav
              aria-label="Social links"
              className="contact-scene__links flex flex-col gap-2 md:gap-2"
            >
              <a
                href={resumeLink.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${resumeLink.label}`}
                className="contact-scene__link contact-scene__link--resume group inline-flex min-h-10 w-fit max-w-full min-w-0 items-center gap-1.5 text-foreground-secondary transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:text-foreground active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:hidden"
              >
                <FileText
                  className="h-[18px] w-[18px] shrink-0 transition-transform duration-[250ms] ease-out group-hover:scale-110"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <span className="whitespace-nowrap font-label-md text-[13px] tracking-wide">
                  Résumé
                </span>
              </a>
              {socialLinks.map((link) => (
                <SocialIcon
                  key={link.id}
                  link={link}
                  className="contact-scene__link"
                />
              ))}
            </nav>
          </Reveal>

          <Reveal
            index={1}
            className="contact-scene__panel cinematic-layer cinematic-layer--panel min-w-0 w-full max-w-full self-start overflow-hidden p-4 max-md:px-3.5 max-md:py-3.5 md:self-center md:p-0"
          >
            <ContactFormLazy />
          </Reveal>
        </div>

        <div className="contact-scene__outro shrink-0">
          <SiteFooter embedded />
        </div>
      </Container>
    </section>
  );
}
