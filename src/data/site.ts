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
    title: "Commercial Reel",
    category: "Instagram Reel",
    duration: "00:34",
    poster: "/images/videos/video-1.svg",
    src: "/videos/showcase-1.mp4",
    hevcSrc: "/videos/showcase-1-hevc.mp4",
    aspect: "portrait",
    featured: true,
  },
  {
    id: "video-landscape-1",
    title: "Brand Film",
    category: "Commercial",
    duration: "01:12",
    poster: "/images/videos/video-2.svg",
    src: "/videos/showcase-2.mp4",
    hevcSrc: "/videos/showcase-2-hevc.mp4",
    aspect: "landscape",
  },
  {
    id: "video-landscape-2",
    title: "Product Story",
    category: "Short Form",
    duration: "00:48",
    poster: "/images/videos/video-3.svg",
    src: "/videos/showcase-3.mp4",
    hevcSrc: "/videos/showcase-3-hevc.mp4",
    aspect: "landscape",
  },
];

export const projectRows: ProjectShowcaseRow[] = [
  {
    id: "row-1",
    website: {
      id: "ecommerce",
      title: "E-Commerce Platform",
      description:
        "A conversion-focused storefront with cinematic product storytelling.",
      category: "Website",
      tags: ["Next.js", "Tailwind CSS", "Framer Motion"],
      image: "/images/projects/digital/website-1.webp",
      imageAlt: "E-commerce platform website design showcase.",
      variant: "website",
      href: "#contact",
    },
    brands: [
      {
        id: "tech-startup",
        title: "Tech Startup Branding",
        description:
          "Identity system built for clarity, scale, and investor confidence.",
        category: "Brand Identity",
        tags: ["Brand Identity", "Typography"],
        image: "/images/projects/brand/poster-1.webp",
        imageAlt: "Brand identity exploration for a tech startup.",
        variant: "brand",
        href: "#contact",
      },
      {
        id: "restaurant",
        title: "Restaurant Menu Design",
        description: "Editorial menus and print assets with quiet luxury.",
        category: "Brand Identity",
        tags: ["Print", "Social Design"],
        image: "/images/projects/brand/poster-2.webp",
        imageAlt: "Collaborative design session for a restaurant brand.",
        variant: "brand",
        href: "#contact",
      },
    ],
  },
  {
    id: "row-2",
    website: {
      id: "agency",
      title: "Creative Agency Portfolio",
      description:
        "An immersive studio site engineered for motion and conversion.",
      category: "Website",
      tags: ["React", "GSAP", "UI/UX"],
      image: "/images/projects/digital/website-2.webp",
      imageAlt: "Creative agency portfolio website design showcase.",
      variant: "website",
      href: "#contact",
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

export const footerLinks: SocialLink[] = socialLinks.filter(
  (link) => link.id !== "github",
);
