"use client";

import dynamic from "next/dynamic";

import { FileText } from "lucide-react";

import { Reveal } from "@/components/animations/reveal";
import { SiteFooter } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import { SocialIcon } from "@/components/ui/social-icon";
import { resumeLink, socialLinks } from "@/data";
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
    <div ref={ref} className="min-h-[220px]">
      {isInView ? <ContactForm /> : null}
    </div>
  );
}

export function Contact() {
  return (
    <section
      id="contact"
      data-snap-frame
      className="section-contact section-tone-contact contact-scene"
      aria-labelledby="contact-heading"
    >
      <Container className="contact-scene__body flex w-full flex-col gap-6 md:gap-7">
        <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          <Reveal className="flex flex-col gap-5 lg:gap-6">
            <div className="flex flex-col gap-4">
              <h2
                id="contact-heading"
                className="max-w-[14ch] font-headline-xl text-[28px] leading-[1.12] tracking-tight text-foreground md:text-[34px] lg:text-[38px]"
              >
                Your Brand Deserves More Than Another Template.
              </h2>

              <a
                href={resumeLink.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="group inline-flex min-h-11 w-fit items-center gap-3 text-foreground-secondary transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:text-foreground active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
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

            <nav aria-label="Social links" className="flex flex-col gap-2.5">
              {socialLinks.map((link) => (
                <SocialIcon key={link.id} link={link} />
              ))}
            </nav>
          </Reveal>

          <Reveal
            index={1}
            className="contact-scene__panel w-full p-4 md:p-6 lg:p-7"
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
