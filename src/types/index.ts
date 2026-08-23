export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    instagram: string;
    youtube: string;
    linkedin: string;
    github?: string;
    email: string;
    twitter?: string;
  };
}

export interface NavItem {
  label: string;
  href: string;
}

export type ServiceIcon = "movie" | "code" | "design_services";

export interface Service {
  id: string;
  title: string;
  description: string;
  approach: string;
  focus: readonly string[];
  icon: ServiceIcon;
  image: string;
  imageAlt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  /** Supporting credit line shown under the title, e.g. "Editing · Color · Sound Design". */
  meta: string;
  duration: string;
  poster: string;
  src?: string;
  hevcSrc?: string;
  webmSrc?: string;
  aspect: "portrait" | "landscape";
  featured?: boolean;
}

export type ProjectVariant = "website" | "brand";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: readonly string[];
  image: string;
  imageAlt: string;
  variant: ProjectVariant;
  href?: string;
}

export interface ProjectShowcaseRow {
  id: string;
  website: Project;
  brands: readonly [Project, Project];
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export interface HeroPortrait {
  id: string;
  src: string;
  alt: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
}
