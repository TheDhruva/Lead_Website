import type {
  HeroPortrait,
  ProjectShowcaseRow,
  Service,
  SiteConfig,
  SocialLink,
  VideoItem,
} from "@/types";

export const siteConfig: SiteConfig = {
  name: "DHRUVA",
  description:
    "Beautiful websites, powerful visuals, and videos that make your brand impossible to ignore. A cinematic approach to digital presence.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dhruva.dev",
  ogImage: "/images/og.svg",
  links: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "#",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "#",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "#",
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "#",
    email: process.env.NEXT_PUBLIC_EMAIL_URL ?? "mailto:hello@dhruva.dev",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
  },
};

/** Paper-cutout faces — cycle through all on both hero sides */
export const heroPortraits: HeroPortrait[] = [
  {
    id: "person-1",
    src: "/images/hero/person-1-cutout.webp",
    alt: "Paper-cutout portrait with a confident smirk.",
  },
  {
    id: "person-2",
    src: "/images/hero/person-2-cutout.webp",
    alt: "Paper-cutout portrait with a focused expression.",
  },
  {
    id: "person-3",
    src: "/images/hero/person-3-cutout.webp",
    alt: "Paper-cutout portrait looking confidently ahead.",
  },
  {
    id: "person-4",
    src: "/images/hero/person-4-cutout.webp",
    alt: "Paper-cutout portrait with an energetic grin.",
  },
];

export const services: Service[] = [
  {
    id: "video-editing",
    title: "Video Editing",
    description:
      "Narrative-driven cinematic cuts that hold attention and build emotional resonance.",
    approach:
      "We treat every cut as intentional storytelling — pacing, sound design, and visual rhythm work together so your brand feels cinematic, not just polished.",
    focus: [
      "Story-first pacing & emotional beats",
      "Color grade & sound that elevate mood",
      "Platform-ready delivery for ads & social",
    ],
    icon: "movie",
    image: "/images/services/video-editing.webp",
    imageAlt:
      "Dark, moody cinematic shot of a professional video editing timeline on a glowing monitor.",
  },
  {
    id: "website-development",
    title: "Website Development",
    description:
      "High-performance, beautifully interactive digital experiences engineered for conversion.",
    approach:
      "We build fast, accessible sites with motion that feels weighted — every interaction supports clarity, trust, and conversion without visual noise.",
    focus: [
      "Performance-first architecture",
      "Cinematic motion & micro-interactions",
      "Conversion-focused UX & SEO foundations",
    ],
    icon: "code",
    image: "/images/services/web-development.webp",
    imageAlt:
      "Abstract minimal composition of sleek glowing code lines floating in dark space.",
  },
  {
    id: "graphic-design",
    title: "Graphic Design",
    description:
      "Striking visual identities that command authority and communicate quality.",
    approach:
      "We craft identities with restraint and precision — typography, spacing, and imagery that signal premium quality at a glance.",
    focus: [
      "Brand systems built for longevity",
      "Typography & layout with editorial clarity",
      "Assets ready for print, web & campaigns",
    ],
    icon: "design_services",
    image: "/images/services/graphic-design.webp",
    imageAlt:
      "Minimalist graphic design workspace showing abstract geometric shapes on a matte screen.",
  },
];

export const videoItems: VideoItem[] = [
  {
    id: "video-featured",
    title: "Short Form",
    category: "Instagram Reel",
    meta: "Reels · Editing · Motion",
    duration: "00:34",
    poster: "/images/videos/showcase-1-poster.webp",
    src: "/videos/showcase-1.mp4",
    hevcSrc: "/videos/showcase-1-hevc.mp4",
    webmSrc: "/videos/showcase-1.webm",
    mobileSrc: "/videos/showcase-1-mobile.mp4",
    mobileHevcSrc: "/videos/showcase-1-mobile-hevc.mp4",
    mobileWebmSrc: "/videos/showcase-1-mobile.webm",
    aspect: "portrait",
    featured: true,
  },
  {
    id: "video-landscape-3",
    title: "Promo Reel",
    category: "Social Media",
    meta: "Editing · Motion · Sound",
    duration: "00:39",
    poster: "/images/videos/showcase-4-poster.webp",
    src: "/videos/showcase-4.mp4",
    hevcSrc: "/videos/showcase-4-hevc.mp4",
    webmSrc: "/videos/showcase-4.webm",
    mobileSrc: "/videos/showcase-4-mobile.mp4",
    mobileHevcSrc: "/videos/showcase-4-mobile-hevc.mp4",
    mobileWebmSrc: "/videos/showcase-4-mobile.webm",
    aspect: "landscape",
  },
  {
    id: "video-landscape-2",
    title: "Product Story",
    category: "Commercial",
    meta: "Commercial · Editing · Storytelling",
    duration: "00:48",
    poster: "/images/videos/showcase-3-poster.webp",
    src: "/videos/showcase-3.mp4",
    hevcSrc: "/videos/showcase-3-hevc.mp4",
    webmSrc: "/videos/showcase-3.webm",
    mobileSrc: "/videos/showcase-3-mobile.mp4",
    mobileHevcSrc: "/videos/showcase-3-mobile-hevc.mp4",
    mobileWebmSrc: "/videos/showcase-3-mobile.webm",
    aspect: "landscape",
  },
  {
    id: "video-landscape-1",
    title: "Brand Film",
    category: "Commercial",
    meta: "Editing · Color · Sound Design",
    duration: "01:12",
    poster: "/images/videos/showcase-2-poster.webp",
    src: "/videos/showcase-2.mp4",
    hevcSrc: "/videos/showcase-2-hevc.mp4",
    webmSrc: "/videos/showcase-2.webm",
    mobileSrc: "/videos/showcase-2-mobile.mp4",
    mobileHevcSrc: "/videos/showcase-2-mobile-hevc.mp4",
    mobileWebmSrc: "/videos/showcase-2-mobile.webm",
    aspect: "landscape",
  },
];

export const projectRows: ProjectShowcaseRow[] = [
  {
    id: "row-1",
    website: {
      id: "driving-school",
      title: "Driving School Website",
      description:
        "A conversion-focused driving academy site with theory LMS and lesson booking.",
      category: "Website",
      tags: ["Next.js", "Tailwind CSS", "Framer Motion"],
      image: "/images/projects/digital/website-1.webp",
      imageAlt: "Driving school website design showcase.",
      variant: "website",
      href: "https://mrdrivingschooluk.netlify.app/",
    },
    brands: [
      {
        id: "local-restaurant-menu",
        title: "Local Restaurant Menu Design",
        description:
          "Editorial menu system with print-ready layouts and social campaign assets.",
        category: "Brand Identity",
        tags: ["Print", "Social Design"],
        image: "/images/projects/brand/poster-1.webp",
        imageAlt: "Local restaurant menu design exploration.",
        variant: "brand",
        href: "#contact",
      },
      {
        id: "product-brand",
        title: "Product Brand Identity",
        description:
          "Packaging and identity system for a contemporary product line.",
        category: "Brand Identity",
        tags: ["Brand Identity", "Packaging"],
        image: "/images/projects/brand/poster-2.webp",
        imageAlt: "Product brand identity design presentation.",
        variant: "brand",
        href: "#contact",
      },
    ],
  },
  {
    id: "row-2",
    website: {
      id: "golf-club",
      title: "Golf Club Landing Website",
      description:
        "A precision-focused golf equipment landing experience built for conversion.",
      category: "Website",
      tags: ["React", "GSAP", "UI/UX"],
      image: "/images/projects/digital/website-2.webp",
      imageAlt: "Golf club landing website design showcase.",
      variant: "website",
      href: "https://golf-mart.netlify.app/",
    },
    brands: [
      {
        id: "apparel",
        title: "Apparel Typography",
        description:
          "Type-led campaign system for a contemporary apparel label.",
        category: "Brand Identity",
        tags: ["Typography", "Campaign"],
        image: "/images/projects/brand/poster-3.webp",
        imageAlt: "Typography work for an apparel brand.",
        variant: "brand",
        href: "#contact",
      },
      {
        id: "event-poster",
        title: "Event Poster Series",
        description:
          "A cohesive poster language for a multi-night cultural series.",
        category: "Brand Identity",
        tags: ["Poster", "Motion"],
        image: "/images/projects/brand/poster-4.webp",
        imageAlt: "Event poster series design presentation.",
        variant: "brand",
        href: "#contact",
      },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: siteConfig.links.instagram,
  },
  {
    id: "youtube",
    label: "YouTube",
    href: siteConfig.links.youtube,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: siteConfig.links.linkedin,
  },
  {
    id: "github",
    label: "GitHub",
    href: siteConfig.links.github ?? "#",
  },
  {
    id: "email",
    label: "Email",
    href: siteConfig.links.email,
  },
];

/** Opens the PDF in a new tab — file lives in /public */
export const resumeLink = {
  id: "resume",
  label: "Résumé",
  href: "/Resume.pdf",
} as const;

export const footerLinks: SocialLink[] = [
  ...socialLinks.filter((link) => link.id !== "github"),
  { id: resumeLink.id, label: resumeLink.label, href: resumeLink.href },
];
