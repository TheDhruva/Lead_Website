# THE DHRUVA

Cinematic digital studio portfolio — a production Next.js app. Beautiful websites, powerful visuals, and videos that make your brand impossible to ignore.

## Tech Stack

| Category         | Technology                |
| ---------------- | ------------------------- |
| Framework        | Next.js 16 (App Router)   |
| UI Library       | React 19                  |
| Language         | TypeScript (strict)       |
| Styling          | Tailwind CSS 4            |
| Animation        | Framer Motion             |
| Smooth Scrolling | Lenis                     |
| Forms            | React Hook Form + Zod     |
| Email            | Resend (server API route) |
| Icons            | Material Symbols Outlined |
| Utilities        | clsx, tailwind-merge      |

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in keys (see below)
pnpm dev
```

Validation:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Requires Node.js >= 20.9.0 (see `engines` in `package.json`).

## Environment Variables

| Variable                        | Required | Purpose                                                                                                                    |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | dev only | Canonical production URL (metadata, OG, sitemap, robots, JSON-LD). Falls back to the production URL in `src/data/site.ts`. |
| `RESEND_API_KEY`                | yes      | Server-side only. Contact form delivery.                                                                                   |
| `CONTACT_FROM_EMAIL`            | yes      | Verified Resend sender.                                                                                                    |
| `CONTACT_TO_EMAIL`              | yes      | Where inquiries are delivered.                                                                                             |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | no       | HubSpot analytics snippet ID. Defaults to the portal ID baked into the layout.                                             |
| `NEXT_PUBLIC_*_URL`s            | no       | Social links; empty values hide the link from the UI and JSON-LD.                                                          |

## Contact Form (Production)

`POST /api/contact` (JSON, max 25 KB) → validated by Zod, delivered via Resend from `CONTACT_FROM_EMAIL` to `CONTACT_TO_EMAIL` with `replyTo` set to the sender.

Security:

- **Honeypot** — invisible `website` field; bots that fill it are silently accepted but no email is sent.
- **Rate limit** — in-memory per-IP, 5 requests per 10 minutes; excess returns `429` with `Retry-After`. NOTE: state is per serverless instance. For traffic beyond a single warm instance, move this to a durable store (Upstash Redis, Vercel KV).
- Hardened status codes: `415` (bad content type), `400` (bad/empty JSON or validation), `413` (too large), `429` (rate limit), `500` (misconfigured / downstream failure), `200` (`{ ok: true }`).

The `.env.example` file documents every key. Never commit real `.env.local`.

## SEO & Social

- `src/app/layout.tsx` — full metadata (title `THE DHRUVA — Cinematic Digital Studio`, description, keywords, canonical, Open Graph + Twitter `summary_large_image`).
- OG image: `public/images/og-cover.png` (1200×630 raster PNG) — browsed by Discord/WhatsApp/X/etc. Generated from `public/ODimage.png` (clients' original asset) with `sharp`.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts` — generated at build (`/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`).
- JSON-LD (`src/components/seo/json-ld.tsx`): `Organization` + `WebSite` schema with only verified data (name, URL, description, logo, defined social `sameAs`) — no invented contact info.
- Below-the-fold sections render server-side `sr-only` summaries so crawlers see real service/project/video content before the interactive (client-lazy) sections hydrate.

## Content

- **Videos:** add showcase files to `public/videos` and point at them from `videoItems` in `src/data/site.ts`. Variants (HEVC/WebM/mobile) are optional; missing ones are skipped safely (note: `showcase-3` and `showcase-4` currently ship MP4-only).
- **Audio:** ambient bed + SFX in `public/audio`; references live in `src/constants/audio.ts` (lowercase filenames).
- **Gallery data:** `src/data/site.ts` (services, projects, socials, footer links, portrait set).

## Notes

- Visual source of truth: `DESIGN.md`. Production domain must match `NEXT_PUBLIC_SITE_URL` on Vercel.
