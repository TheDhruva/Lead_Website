"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

import { FileText } from "lucide-react";

import { Reveal } from "@/components/animations/reveal";
import { AnimatedText } from "@/components/motion/animated-text";
import { ContactFormSkeleton } from "@/components/ui/contact-form-skeleton";
import { Container } from "@/components/ui/container";
import { SocialIcon } from "@/components/ui/social-icon";
import { resumeLink, socialLinks } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useSectionEnterSound } from "@/hooks/use-section-enter-sound";
import { useAudio } from "@/providers/audio-provider";

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
  // One warm swell on meaningful section entry.
  useSectionEnterSound(sectionRef, "intro-swell");
  const { play } = useAudio();
  const canHoverTick = useCanPointerReact();
  const hoverTick = canHoverTick ? () => play("ui-hover") : undefined;

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-snap-frame
      className="section-contact section-tone-contact contact-scene"
      aria-labelledby="contact-heading"
    >
      <Container className="contact-scene__body flex w-full min-w-0 max-w-none flex-col gap-5 md:max-h-full md:gap-3 lg:gap-4">
        <div className="contact-scene__main grid min-h-0 min-w-0 flex-1 grid-cols-1 items-start gap-4 max-md:gap-3.5 lg:items-start lg:gap-0">
          <div className="cinematic-layer cinematic-layer--links min-w-0 lg:self-start">
            <div className="contact-scene__intro flex min-w-0 flex-col gap-4 max-md:gap-3 md:gap-4">
              <Reveal y={16}>
                <h2
                  id="contact-heading"
                  className="contact-scene__heading cinematic-layer cinematic-layer--heading font-headline-xl font-extrabold text-foreground"
                >
                  <span className="contact-scene__heading-line block">
                    <AnimatedText segments="Your Brand Deserves" />
                  </span>
                  <span className="contact-scene__heading-line block">
                    <AnimatedText delay={0.12} segments="More Than Another" />
                  </span>
                  <span className="contact-scene__heading-line contact-scene__heading-line--accent font-display block italic">
                    <AnimatedText delay={0.24} segments="Template." />
                  </span>
                </h2>
              </Reveal>

              <div className="flex min-w-0 flex-col gap-4 max-md:gap-3 md:gap-4">
                <Reveal index={1}>
                  <a
                    href={resumeLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={hoverTick}
                    onClick={() => play("ui-click")}
                    className="contact-scene__resume-desktop group hidden min-h-11 w-fit items-center gap-3 text-foreground-secondary transition-[transform,color] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:text-foreground active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:inline-flex"
                  >
                    <FileText
                      className="h-5 w-5 transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                      aria-hidden="true"
                      strokeWidth={1.75}
                    />
                    <span className="font-sans text-[15px] font-medium tracking-wide">
                      View {resumeLink.label}
                    </span>
                  </a>
                </Reveal>

                <nav
                  aria-label="Social links"
                  className="contact-scene__links flex flex-col gap-2 md:gap-2"
                >
                  <Reveal index={2} className="min-w-0">
                    <a
                      href={resumeLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${resumeLink.label}`}
                      onMouseEnter={hoverTick}
                      onClick={() => play("ui-click")}
                      className="contact-scene__link contact-scene__link--resume group inline-flex min-h-10 w-fit max-w-full min-w-0 items-center gap-1.5 text-foreground-secondary transition-[transform,color] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:text-foreground active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:hidden"
                    >
                      <FileText
                        className="h-[18px] w-[18px] shrink-0 transition-transform duration-[250ms] ease-out group-hover:scale-110"
                        aria-hidden="true"
                        strokeWidth={1.75}
                      />
                      <span className="whitespace-nowrap font-sans text-[14px] font-medium tracking-wide">
                        Résumé
                      </span>
                    </a>
                  </Reveal>
                  {socialLinks.map((link, i) => (
                    <Reveal key={link.id} index={3 + i} className="min-w-0">
                      <SocialIcon link={link} className="contact-scene__link" />
                    </Reveal>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="cinematic-layer cinematic-layer--panel min-w-0 w-full max-w-full self-start lg:self-start">
            <Reveal
              index={2}
              y={24}
              scale={0.985}
              className="contact-scene__panel w-full overflow-hidden"
            >
              <ContactFormLazy />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
