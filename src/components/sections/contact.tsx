"use client";

import { m, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SocialIcon } from "@/components/ui/social-icon";
import { EASING_CINEMATIC } from "@/constants";
import { socialLinks } from "@/data";

import { ContactForm } from "./contact-form";

export function Contact() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="contact"
      className="bg-surface-container-lowest px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="contact-heading"
    >
      <Container>
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: EASING_CINEMATIC }}
            className="flex min-h-[420px] flex-col justify-between gap-16 lg:min-h-[520px]"
          >
            <h2
              id="contact-heading"
              className="max-w-md font-headline-xl text-[36px] leading-[1.15] tracking-tight text-foreground md:text-headline-xl lg:text-[48px]"
            >
              Your Brand Deserves More Than Another Template.
            </h2>

            <nav aria-label="Social links" className="flex flex-col gap-5">
              {socialLinks.map((link) => (
                <SocialIcon key={link.id} link={link} />
              ))}
            </nav>
          </m.div>

          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: prefersReducedMotion ? 0 : 0.1,
              ease: EASING_CINEMATIC,
            }}
          >
            <Card className="p-6 md:p-8" innerGlow>
              <ContactForm />
            </Card>
          </m.div>
        </div>
      </Container>
    </section>
  );
}
