# Dhruva

Cinematic portfolio — production Next.js app matching the approved `code.html` / `DESIGN.md` prototype.

## Tech Stack

| Category         | Technology                |
| ---------------- | ------------------------- |
| Framework        | Next.js (App Router)      |
| UI Library       | React 19                  |
| Language         | TypeScript (strict)       |
| Styling          | Tailwind CSS 4            |
| Animation        | Framer Motion             |
| Smooth Scrolling | Lenis                     |
| Forms            | React Hook Form + Zod     |
| Icons            | Material Symbols Outlined |
| Utilities        | clsx, tailwind-merge      |

## Folder Structure

```
src/
├── app/                      # App Router + metadata
├── components/
│   ├── animations/           # Reveal, PageTransition, ScrollTrigger
│   ├── layout/               # Navbar, Footer
│   ├── sections/             # TheatreIntro, Hero, Services, VideoShowcase, Projects, Contact
│   └── ui/                   # Button, Card, SectionTitle, Container, Input, Textarea, Select, SocialIcon, ProjectCard, ServiceCard, VideoCard
├── constants/
├── data/
├── hooks/
├── lib/
├── providers/
└── types/
public/
├── images/                   # Local image placeholders
└── videos/                   # Drop showcase-*.mp4 here
```

## Getting Started

```bash
pnpm install
pnpm dev
```

```bash
pnpm build
pnpm lint
pnpm typecheck
```

## Notes

- Visual source of truth: `code.html` + `DESIGN.md`
- Videos: add muted looping files to `public/videos` and set `src` on items in `src/data/site.ts`
- Contact form validates client-side only (no backend yet)
