"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "framer-motion";
import {
  Controller,
  type FieldErrors,
  useForm,
  useWatch,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_BUDGETS,
  CONTACT_SERVICES,
  CONTACT_TIMELINES,
  EASING_OUT,
} from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSfxHandlers } from "@/hooks/use-sfx-handlers";
import {
  CONTACT_MESSAGE_MAX,
  type ContactFormValues,
  contactFormSchema,
} from "@/lib/validations/contact";
import { useAudio } from "@/providers/audio-provider";

const defaultValues: ContactFormValues = {
  name: "",
  email: "",
  service: "Website",
  budget: "Let's Discuss",
  timeline: "Flexible",
  message: "",
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { play } = useAudio();
  const { onFocus: playInputFocus } = useSfxHandlers();

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const messageValue = useWatch({ control, name: "message" });
  const messageLength = messageValue?.length ?? 0;

  const onInvalid = (fieldErrors: FieldErrors<ContactFormValues>) => {
    const firstKey = Object.keys(fieldErrors)[0] as
      keyof ContactFormValues | undefined;
    if (firstKey) setFocus(firstKey);
  };

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

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        fields?: Partial<Record<keyof ContactFormValues, string>>;
      } | null;

      if (!response.ok) {
        if (payload?.fields) {
          for (const [key, message] of Object.entries(payload.fields)) {
            if (message) {
              setError(key as keyof ContactFormValues, { message });
            }
          }
        }

        setSubmissionError(
          payload?.error ??
            (response.status === 413
              ? "Your message is too long. Please shorten it and try again."
              : "Something went wrong. Please try again."),
        );
        return;
      }

      setSubmitted(true);
      play("submitSuccess");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setSubmissionError(
          "Request timed out. Please check your connection and try again.",
        );
        return;
      }

      setSubmissionError("Something went wrong. Please try again.");
    }
  };

  const handleSendAnother = () => {
    reset(defaultValues);
    setSubmissionError(null);
    setSubmitted(false);
  };

  const nameField = register("name");
  const emailField = register("email");
  const messageField = register("message");

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
          transition={{ duration: 0.5, ease: EASING_OUT }}
          className="contact-form__success flex min-h-[260px] flex-col justify-center py-2"
        >
          <div
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-sm)]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-headline-lg text-2xl tracking-[-0.03em] text-foreground md:text-[28px]">
            Message received
          </p>
          <div className="mt-5 h-px w-12 bg-border" aria-hidden="true" />
          <p className="mt-5 max-w-sm font-body-md text-body-md leading-[1.7] text-foreground-secondary">
            I&apos;ll personally review your project and get back to you as soon
            as possible.
          </p>
          <p className="mt-8 font-body-md text-body-md text-foreground-secondary">
            Talk soon.
          </p>
          <p className="mt-2 font-label-md text-label-md tracking-[0.08em] text-foreground uppercase">
            — Dhruva
          </p>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="mt-8 w-fit"
            onClick={handleSendAnother}
          >
            Send another message
          </Button>
        </m.div>
      ) : (
        <m.form
          key="form"
          className="contact-form flex min-w-0 flex-col gap-3 max-md:gap-2.5 md:gap-2"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          aria-label="Contact form"
          initial={false}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASING_OUT }}
        >
          <div className="grid min-w-0 grid-cols-1 gap-3 max-md:gap-2.5 sm:grid-cols-2 md:gap-2">
            <Input
              label="Name"
              placeholder="Jane Doe"
              autoComplete="name"
              error={errors.name?.message}
              {...nameField}
              onFocus={() => playInputFocus()}
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...emailField}
              onFocus={() => playInputFocus()}
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
                compact
              />
            )}
          />

          <div className="grid min-w-0 grid-cols-1 gap-3 max-md:gap-2.5 sm:grid-cols-2 md:gap-2">
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
                  compact
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
                  compact
                />
              )}
            />
          </div>

          <div>
            <Textarea
              label="Project Description"
              placeholder="Tell me about your project, goals, and anything you'd like me to know..."
              rows={2}
              maxLength={CONTACT_MESSAGE_MAX}
              error={errors.message?.message}
              {...messageField}
              onFocus={() => playInputFocus()}
            />
            <p
              className="contact-form__char-count mt-1.5 text-right text-xs text-foreground-secondary"
              aria-live="polite"
            >
              {messageLength}/{CONTACT_MESSAGE_MAX}
            </p>
          </div>

          {submissionError ? (
            <p role="alert" aria-live="polite" className="text-sm text-error">
              {submissionError}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            fullWidth
            sfx
            disabled={isSubmitting}
            className="contact-form__submit mt-0.5 min-h-12 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] md:min-h-10 md:py-2.5 md:text-sm"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="h-4 w-4 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin"
                  style={{ animationDuration: "0.85s" }}
                  aria-hidden="true"
                />
                Sending
              </span>
            ) : (
              "Let's Build Something Great"
            )}
          </Button>
        </m.form>
      )}
    </AnimatePresence>
  );
}
