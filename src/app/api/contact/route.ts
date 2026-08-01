import { NextResponse } from "next/server";

import { resend } from "@/lib/resend";
import { contactFormSchema } from "@/lib/validations/contact";

const MAX_BODY_BYTES = 25 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Invalid content type." },
      { status: 415 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read request body." },
      { status: 400 },
    );
  }

  if (raw.length === 0) {
    return NextResponse.json({ error: "Empty request body." }, { status: 400 });
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(
        ([key, values]) => [key, values?.[0] ?? "Invalid value."],
      ),
    );
    return NextResponse.json(
      { error: "Validation failed.", fields: fieldErrors },
      { status: 400 },
    );
  }

  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!resend || !from || !to) {
    return NextResponse.json(
      { error: "Contact form is not configured." },
      { status: 500 },
    );
  }

  const { name, email, service, budget, timeline, message } = parsed.data;

  const submittedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const subject = `New Portfolio Inquiry — ${service} — ${name}`;
  const text = [
    "Name:",
    name,
    "",
    "Email:",
    email,
    "",
    "Selected Service:",
    service,
    "",
    "Budget:",
    budget,
    "",
    "Timeline:",
    timeline,
    "",
    "Project Description:",
    message,
    "",
    `Submitted Time: ${submittedAt}`,
  ].join("\n");

  try {
    await resend.emails.send({ from, to, subject, text });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
