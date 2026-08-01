"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_BUDGETS,
  CONTACT_SERVICES,
  CONTACT_TIMELINES,
  EASING_CINEMATIC,
} from "@/constants";
import {
  type ContactFormValues,
  contactFormSchema,
} from "@/lib/validations/contact";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      service: "Website",
      budget: "Let's Discuss",
      timeline: "Flexible",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setSubmissionError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        setSubmissionError("Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmissionError("Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <m.div
          key="success"
          role="status"
          aria-live="polite"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.55, ease: EASING_CINEMATIC }}
          className="flex min-h-[420px] flex-col justify-center py-4"
        >
          <p className="font-headline-lg text-2xl text-foreground md:text-[28px]">
            ✓ Message Received
          </p>
          <p className="mt-4 max-w-sm font-body-md text-body-md text-foreground-secondary">
            I&apos;ll personally review your project and get back to you as soon
            as possible.
          </p>
          <p className="mt-8 font-body-md text-body-md text-foreground-secondary">
            Talk soon.
          </p>
          <p className="mt-2 font-label-md text-label-md text-foreground">
            — Dhruva
          </p>
        </m.div>
      ) : (
        <m.form
          key="form"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Contact form"
          initial={false}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASING_CINEMATIC }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Name"
              placeholder="Jane Doe"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <Controller
            name="service"
            control={control}
            render={({ field }) => (
              <ChipGroup
                name="service"
                label="Service"
                options={CONTACT_SERVICES}
                value={field.value}
                onChange={field.onChange}
                error={errors.service?.message}
              />
            )}
          />

          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <ChipGroup
                name="budget"
                label="Budget"
                options={CONTACT_BUDGETS}
                value={field.value}
                onChange={field.onChange}
                error={errors.budget?.message}
              />
            )}
          />

          <Controller
            name="timeline"
            control={control}
            render={({ field }) => (
              <ChipGroup
                name="timeline"
                label="Timeline"
                options={CONTACT_TIMELINES}
                value={field.value}
                onChange={field.onChange}
                error={errors.timeline?.message}
              />
            )}
          />

          <Textarea
            label="Project Description"
            placeholder="Tell me about your project, goals, and anything you'd like me to know..."
            rows={5}
            error={errors.message?.message}
            {...register("message")}
          />

          {submissionError ? (
            <p role="alert" aria-live="polite" className="text-sm text-error">
              {submissionError}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-2 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            {isSubmitting ? "Sending..." : "Let's Build Something Great"}
          </Button>
        </m.form>
      )}
    </AnimatePresence>
  );
}
