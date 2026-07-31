---
name: Cinematic Noir
colors:
  surface: "#141313"
  surface-dim: "#141313"
  surface-bright: "#3a3939"
  surface-container-lowest: "#0e0e0e"
  surface-container-low: "#1c1b1b"
  surface-container: "#201f1f"
  surface-container-high: "#2a2a2a"
  surface-container-highest: "#353434"
  on-surface: "#e5e2e1"
  on-surface-variant: "#c4c7c8"
  inverse-surface: "#e5e2e1"
  inverse-on-surface: "#313030"
  outline: "#8e9192"
  outline-variant: "#444748"
  surface-tint: "#c6c6c7"
  primary: "#ffffff"
  on-primary: "#2f3131"
  primary-container: "#e2e2e2"
  on-primary-container: "#636565"
  inverse-primary: "#5d5f5f"
  secondary: "#c6c6c7"
  on-secondary: "#2f3131"
  secondary-container: "#454747"
  on-secondary-container: "#b4b5b5"
  tertiary: "#ffffff"
  on-tertiary: "#2f3131"
  tertiary-container: "#e2e2e2"
  on-tertiary-container: "#636565"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e2e2e2"
  primary-fixed-dim: "#c6c6c7"
  on-primary-fixed: "#1a1c1c"
  on-primary-fixed-variant: "#454747"
  secondary-fixed: "#e2e2e2"
  secondary-fixed-dim: "#c6c6c7"
  on-secondary-fixed: "#1a1c1c"
  on-secondary-fixed-variant: "#454747"
  tertiary-fixed: "#e2e2e2"
  tertiary-fixed-dim: "#c6c6c7"
  on-tertiary-fixed: "#1a1c1c"
  on-tertiary-fixed-variant: "#454747"
  background: "#141313"
  on-background: "#e5e2e1"
  surface-variant: "#353434"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: "800"
    lineHeight: "1.1"
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: "800"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: "800"
    lineHeight: "1.2"
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.3"
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: 0.02em
  button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  section-gap: 160px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on the principles of **Cinematic Minimalism**, emphasizing a high-end, editorial feel that prioritizes focus and prestige. The target audience includes luxury brands, tech innovators, and creative leaders who value precision and understated elegance.

The visual language draws heavily from the polished aesthetics of industry leaders like Apple and Linear. It utilizes a deep, monochromatic palette to create a sense of infinite depth. The emotional response is one of calm authority, professional trust, and uncompromising quality. Motion should be perceived as "weighted"—smooth, purposeful transitions that mimic high-end cinematography rather than rapid, jittery animations.

## Colors

The palette is strictly monochromatic, relying on luminosity and value shifts rather than hue to create hierarchy.

- **Primary Background (#0E0E0E):** The foundational layer, providing a deep, "true black" feel for maximum contrast with text.
- **Secondary Background (#171717):** Used for structural sections or to create a slight lift from the base layer.
- **Surface/Cards (#202020):** The highest elevation layer for interactive or grouped content.
- **Accent (White):** Used sparingly for call-to-actions and key highlights to maintain a premium, focused aesthetic.
- **Borders:** Extremely subtle at 8% white opacity, acting as a "whisper" of a container rather than a hard boundary.

## Typography

The design system utilizes **Inter** exclusively to ensure a systematic, clean, and highly legible experience.

High-impact headings use **ExtraBold** weights with tight letter-spacing to create a "locked" and authoritative visual block. Body copy uses **Regular** weight with a generous line height (1.6) to ensure maximum readability and a relaxed, airy feel. Buttons and small labels use **SemiBold** to distinguish them as functional elements without needing additional decorative cues. All type should be rendered with `-webkit-font-smoothing: antialiased` to maintain the premium, sharp look on high-resolution displays.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1280px max-width wrapper but flows fluidly on smaller screens.

Whitespace is treated as a core design element, not just a separator. Section gaps are intentionally large (160px+) to allow the brand's visual assets to "breathe." A 12-column grid is used for desktop layouts, with elements often centered or spanning specific column counts (e.g., 6 columns for text blocks) to maintain an editorial rhythm. On mobile, margins reduce to 20px, and the layout collapses to a single-column vertical stack.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Shadows**.

Instead of traditional drop shadows that mimic a direct light source, this design system uses ambient, multi-layered occlusion shadows. Shadows should be ultra-diffused (0% to 15% opacity max) and inherit the dark background tint.

Interactive elements like cards use a subtle "inner glow" via a top border of `rgba(255,255,255,0.05)` to simulate a beveled edge. When an element is raised (on hover), it should transition smoothly with a background color shift from `#202020` to a slightly lighter tint, coupled with a scale increase of 1.02x to mimic physical proximity.

## Shapes

The shape language is sophisticated and modern. All containers and buttons utilize a **0.5rem (8px)** base radius. This provides a soft, approachable feel that balances the aggressive "industrial" nature of the dark color palette.

For larger components like hero images or primary cards, use `rounded-xl` (1.5rem/24px) to emphasize their role as distinct content modules. Form inputs and chips maintain the base 8px radius for a consistent functional look.

## Components

- **Buttons:** Primary buttons are solid White with #0E0E0E text. Secondary buttons are outlined with `border_subtle`. Transitions must be slow (300ms) using `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Cards:** Cards use the `#202020` surface color with a 1px `border_subtle`. They should have no shadow in their default state, only gaining a soft ambient shadow upon interaction.
- **Inputs:** Input fields are background-less with a bottom border of `border_subtle`. On focus, the border transitions to full White.
- **Chips/Badges:** Small, subtle containers with `#171717` background and `text_secondary`. These should be used for categories or tags.
- **Lists:** Clean, border-separated rows with `body-md` text. Hovering a row should trigger a subtle `#171717` background highlight.
- **Navigation:** A sticky, glassmorphic header using `backdrop-filter: blur(12px)` and a background of `rgba(14, 14, 14, 0.8)` ensures content remains legible while scrolling.
