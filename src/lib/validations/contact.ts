import { z } from "zod";

import {
  CONTACT_BUDGETS,
  CONTACT_SERVICES,
  CONTACT_TIMELINES,
} from "@/constants";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  service: z.enum(CONTACT_SERVICES),
  budget: z.enum(CONTACT_BUDGETS),
  timeline: z.enum(CONTACT_TIMELINES),
  message: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
