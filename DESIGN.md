---
name: Paper Ink Lacquer
colors:
  paper: "#f5f4f0"
  parchment: "#eae6de"
  ink: "#171515"
  soft-ink: "#2a2523"
  lacquer: "#c91524"
  dark-lacquer: "#780a12"
  bright-lacquer: "#d62533"
  clay: "#70413a"
  brass: "#b8955a"
  background-light: "#f5f4f0"
  background-dark: "#171313"
  foreground-light: "#171515"
  foreground-dark: "#f5f4f0"
  card-light: "#ffffff"
  card-dark: "#211c1b"
  border-light: "rgb(23 21 21 / 0.14)"
  border-dark: "rgb(245 244 240 / 0.14)"
  error-light: "#c91524"
  error-dark: "#ff9d94"
typography:
  # Three locked families (see src/lib/fonts.ts). Roles never change.
  ui-body:
    fontFamily: Manrope
    weights: ["400", "500", "600", "700", "800"]
    roles: "body, UI, navigation, sans headings, buttons, chips, form"
  editorial-accent:
    fontFamily: Instrument Serif
    weights: ["400"]
    styles: ["normal", "italic"]
    roles: "Presence word, Contact 'Template.' accent — personality moments only"
  condensed-display:
    fontFamily: Anton
    weights: ["400"]
    roles: "Hero headline, theatre intro wordmark — massive poster type only"
  # Type tokens shipped in src/app/globals.css (@theme inline).
  # Headline/body sizes below are defaults; hero/intro/section
  # headings use fluid clamp() formulas inline (intentional editorial scale).
  headline-xl:
    fontSize: 48px
    fontWeight: "800"
    lineHeight: "1.15"
    letterSpacing: -0.03em
  headline-lg:
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.25"
    letterSpacing: -0.03em
  body-lg:
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.65"
    letterSpacing: 0em
  body-md:
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.7"
    letterSpacing: 0em
  label-md:
    fontSize: 14px
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: 0.02em
  button:
    fontSize: 15px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.01em
rounded:
  sm: 0.625rem
  md: 0.875rem
  lg: 1.25rem
  xl: 1.5rem
  2xl: 2rem
  full: 9999px
  form-compact: 0.9375rem
spacing:
  section-gap: 96px
  container-max: 1480px
  container-width: "min(92vw, 1480px)"
  gutter: 24px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-head-gap: 1.25rem
  section-head-gap-md: 2rem
breakpoints:
  # Structural layout modes. CSS media queries and JS useMediaQuery
  # thresholds agree: everything compositional switches at lg (1024px).
  # Gutters and contact density compress at md (768px) for fit, not language.
  compact: "below 1024px — mobile design language (stacks, menu sheet)"
  wide: "1024px and up — desktop compositions, floating pill nav"
  squeeze: "380px and below — wordmark/lockup guards"
  short: "720px/820px/940px heights — chrome compression guards"
---

## Brand & Style

This design system is built on the principles of **Cinematic Minimalism**, emphasizing a high-end, editorial feel that prioritizes focus and prestige. The target audience includes luxury brands, tech innovators, and creative leaders who value precision and understated elegance.

The visual language is **Paper × Ink × Lacquer**: a warm light-first canvas (`#f5f4f0`) with a deep cinematic dark mode (`#171313`), ink text, and a single lacquer-red identity accent (`#c91524`) reserved for active states, primary actions, and selections. Sections stay transparent — one continuous canvas painted by a global atmosphere layer — instead of hard-cut color blocks. Motion should be perceived as "weighted" — smooth, purposeful transitions that mimic high-end cinematography rather than rapid, jittery animations.

## Colors

- **Paper (#F5F4F0) / Ink (#171515):** Light-mode foundation and text.
- **Dark Ink (#171313):** Dark-mode foundation; text flips to warm paper.
- **Lacquer (#C91524):** The identity accent — primary buttons, active nav pill, progress, selections. Used sparingly.
- **Surfaces:** Cards `#ffffff` (light) / `#211c1b` (dark); secondary backgrounds `#ece9e2` / `#201b1a`.
- **Borders:** Whisper lines at 14% ink (light) / 14% paper (dark); hover states deepen to ~28%/24%.

## Typography

Three locked families (loaded via `next/font`, no runtime font requests):

- **Manrope** — all UI, body, navigation, sans headings, buttons, chips, form. Weights 400–800.
- **Instrument Serif** — editorial accents only (Hero `Presence`, Contact `Template.`). Italic personality, never body text.
- **Anton** — massive condensed display only (Hero headline, theatre intro wordmark). Single 400 weight, never synthesized bold.

High-impact headings use ExtraBold Manrope (or Anton for poster moments) with tight letter-spacing. Oversized editorial type (intro wordmark, hero headline, section headings) is **intentional identity** — consistency comes from spacing relationships, max-widths, and responsive rules, never by shrinking it. Body copy uses Regular weight with generous line height (1.65–1.7). All type renders antialiased.

Shared section headings (Services, Motion) use one fluid formula with a viewport fit-cap; Projects keeps deck-tuned caps within the same `.section-heading` rhythm (gap + balance shared, sizes intentionally distinct).

## Layout & Spacing

**Canonical container:** `--container-max-width: 1480px`, consumed as `min(92vw, 1480px)` with centered `nav-inset` gutters. Named section dialects intentionally diverge and are documented at their components:

- `hero composition` — centered text, custom px rhythm around portraits.
- `project deck` — `min(94vw, 80rem)` sticky-stage frame.
- `video cinematic` — height-driven `max-w` so the 16:9 player clears the floating nav.
- `contact form` — `800px` panel (`700px` at wide desktop).

**Responsive modes:** `compact` below 1024px, `wide` at 1024px+. Hero, Services, Video grid, Projects grid, floating pill, and the menu sheet all switch at `lg` (CSS and JS agree). Gutters switch 20px/24px at 768px; contact density compresses at 768px for 100svh fit. Squeeze guards at ≤380px protect the wordmark and lockups; short-height guards (≤940/820px) compress contact chrome; landscape-mobile rules compress the hero. Fluid `clamp()/min()/max()` interpolates within modes — no JS-driven sizing.

**Contact density:** the form owns compact editorial density via `--form-*` semantic tokens (single source for all breakpoint overrides). Shared `Input`/`Textarea`/`ChipGroup` expose neutral defaults; the scoped contact layer owns in-form values.

## Elevation & Depth

Hierarchy is established through **tonal layering and soft ambient shadows** (`--shadow-sm/md/lg`, theme-aware). Interactive elements carry a subtle top inner glow. Hover lifts are restrained (`-translate-y-px` + shadow step); press depths are frozen per control family (buttons `0.985`, icon controls `0.96`).

## Shapes

Radius language (semantic, not flat): `sm 10px` / `md 14px` (buttons) / `lg 20px` (cards, panels, inputs) / `xl 24px` / `2xl 32px` / `full` (chips, pill nav). Mobile form controls share `--radius-form-compact 15px`.

## Components

- **Buttons:** `sm ≈ 36px / md ≈ 44px / lg ≈ 48px` ladder, text sizes owned by the size map only. Primary = lacquer; secondary = bordered transparent; ghost = borderless. Contact submit = `lg` base with a named density exception (44px desktop for stage fit, 52px mobile touch target).
- **Cards:** bordered surfaces, rest shadow only on active/hover. Services accordion expands active `3.2:1` via CSS `flex-grow`; mobile uses `grid-rows` expansion.
- **Inputs/Textarea:** bordered, `rounded-lg`, ring-30 focus; contact density via tokens.
- **Chips:** `compact 40px/12px` and `default 44px/14px`, `rounded-full`; contact references the system via scoped overrides, never a parallel scale.
- **Video list:** border-separated index rows (`12px` tracked titles, `11px` meta, 16:9 thumbs); active row carries a lacquer micro-indicator.
- **Navigation:** transparent 40/48px bar (sticky on compact, absolute on wide), 36px control family (Hire, theme, menu), floating pill with gliding lacquer indicator on wide, menu sheet with focus trap below `lg`.

## Performance Contract

- CSS owns geometry (`clamp()`, grid/flex, container-relative units). No JS font/padding measurement, no resize listeners for layout, no per-frame React state.
- Scroll: native scrollport, no snap; settle correction and gesture navigation are the only scroll-time systems. Video uses velocity gating + imperative play/pause + one `scaleX` progress loop; Projects deck measures geometry on mount/resize and quantizes progress — sheets consume MotionValues, never re-render per frame.
- Animation cost order: CSS transition → WAAPI/imperative → RAF → React state (state only for genuine app state).
- Media: hero portrait preloaded (LCP), first video poster warmed, video bytes on visibility, next-video JIT preload, project neighbor idle-warm, two-sheet deck virtualization.
