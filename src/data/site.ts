import type {
  HeroPortrait,
  ProjectShowcaseRow,
  Service,
  SiteConfig,
  SocialLink,
  VideoItem,
} from "@/types";

const configuredUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL?.trim()
    : undefined;
const vercelUrl =
  typeof process !== "undefined" ? process.env.VERCEL_URL?.trim() : undefined;

function resolveSiteUrl(): string {
  if (configuredUrl) {
    let url: URL;
    try {
      url = new URL(configuredUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) URL.");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
    }

    return url.toString().replace(/\/$/, "");
  }

  return vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

export const siteConfig: SiteConfig = {
  name: "The Dhruva",
  description:
    "Beautiful websites, powerful visuals, and videos that make your brand impossible to ignore. A cinematic approach to digital presence.",
  url: siteUrl,
  ogImage: "/images/og-cover.jpg",
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
      "Turn raw footage into videos that feel intentional, cinematic, and built to hold attention.",
    approach:
      "Turn raw footage into videos that feel intentional, cinematic, and built to hold attention.",
    focus: [
      "Story-driven pacing",
      "Cinematic color & sound",
      "Ready for social & ads",
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
      "Fast, purposeful websites designed to look distinctive, feel effortless, and turn visitors into clients.",
    approach:
      "Fast, purposeful websites designed to look distinctive, feel effortless, and turn visitors into clients.",
    focus: [
      "Fast, responsive builds",
      "Motion with purpose",
      "SEO & conversion ready",
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
      "Visual systems built with strong typography, spacing, and direction so your brand feels instantly recognizable.",
    approach:
      "Visual systems built with strong typography, spacing, and direction so your brand feels instantly recognizable.",
    focus: [
      "Distinctive brand systems",
      "Editorial typography & layout",
      "Ready for web & campaigns",
    ],
    icon: "design_services",
    image: "/images/services/graphic-design.webp",
    imageAlt:
      "Minimalist graphic design workspace showing abstract geometric shapes on a matte screen.",
  },
];

export const videoItems: VideoItem[] = [
  {
    id: "video-classic-spot",
    title: "YouTube Edit",
    category: "YouTube",
    meta: "Editing · YouTube",
    duration: "00:29",
    poster: "/images/videos/showcase-5-poster.webp",
    src: "/videos/showcase-5-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-5-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-5-norm.webm?v=3",
    mobileSrc: "/videos/showcase-5-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-5-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-5-mobile-norm.webm?v=3",
    aspect: "landscape",
    featured: true,
  },
  {
    id: "video-street-reel",
    title: "Motion Art",
    category: "2D Motion",
    meta: "2D Motion · Editing",
    duration: "00:09",
    poster: "/images/videos/showcase-6-poster.webp",
    src: "/videos/showcase-6-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-6-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-6-norm.webm?v=3",
    mobileSrc: "/videos/showcase-6-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-6-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-6-mobile-norm.webm?v=3",
    aspect: "portrait",
  },
  {
    id: "video-featured",
    title: "Personal Brand",
    category: "Brand Film",
    meta: "Brand Film · Editing",
    duration: "00:34",
    poster: "/images/videos/showcase-1-poster.webp?v=3",
    src: "/videos/showcase-1-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-1-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-1-norm.webm?v=3",
    mobileSrc: "/videos/showcase-1-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-1-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-1-mobile-norm.webm?v=3",
    aspect: "landscape",
  },
  {
    id: "video-landscape-3",
    title: "Editing Talk",
    category: "Video Editing",
    meta: "Video Editing · Talk",
    duration: "00:39",
    poster: "/images/videos/showcase-4-poster.webp",
    src: "/videos/showcase-4-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-4-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-4-norm.webm?v=3",
    mobileSrc: "/videos/showcase-4-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-4-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-4-mobile-norm.webm?v=3",
    aspect: "landscape",
  },
  {
    id: "video-landscape-2",
    title: "Silksong",
    category: "Gameplay",
    meta: "Gameplay · Editing",
    duration: "00:48",
    poster: "/images/videos/showcase-3-poster.webp",
    src: "/videos/showcase-3-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-3-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-3-norm.webm?v=3",
    mobileSrc: "/videos/showcase-3-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-3-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-3-mobile-norm.webm?v=3",
    aspect: "landscape",
  },
  {
    id: "video-landscape-1",
    title: "Web Dev Talk",
    category: "Web Development",
    meta: "Web Development · Talk",
    duration: "00:37",
    poster: "/images/videos/showcase-2-poster.webp?v=3",
    src: "/videos/showcase-2-norm.mp4?v=3",
    hevcSrc: "/videos/showcase-2-hevc-norm.mp4?v=3",
    webmSrc: "/videos/showcase-2-norm.webm?v=3",
    mobileSrc: "/videos/showcase-2-mobile-norm.mp4?v=3",
    mobileHevcSrc: "/videos/showcase-2-mobile-hevc-norm.mp4?v=3",
    mobileWebmSrc: "/videos/showcase-2-mobile-norm.webm?v=3",
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
        "A conversion-focused driving school site built around courses, trust, and lesson booking.",
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
          "A print-ready menu system built for restaurant and social applications.",
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
          "A visual identity and packaging system for a contemporary product line.",
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
        "A product-focused landing experience designed around clarity and conversion.",
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
        description: "A type-led visual system built for an apparel campaign.",
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
          "A unified poster system for a multi-night cultural event.",
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
    href: siteConfig.links.github ?? "",
  },
  {
    id: "email",
    label: "Email",
    href: siteConfig.links.email,
  },
].filter((link) => isUsableUrl(link.href));

/** Treats placeholder/empty values as missing so dead "#" links are never rendered. */
function isUsableUrl(value: string | undefined | null): value is string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 && trimmed !== "#";
}

/** Opens the PDF in a new tab — file lives in /public */
export const resumeLink = {
  id: "resume",
  label: "Résumé",
  href: "/Resume.pdf",
} as const;
