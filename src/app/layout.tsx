import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/data";
import { heroPortraits } from "@/data";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
  AnimationProvider,
  InkProvider,
  SmoothScrollProvider,
  TheatreIntroProvider,
  ThemeProvider,
} from "@/providers";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "DHRUVA - Cinematic Portfolio",
    template: "%s | DHRUVA",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  keywords: [
    "DHRUVA",
    "cinematic portfolio",
    "video editing",
    "website development",
    "graphic design",
    "brand identity",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DHRUVA - Cinematic Portfolio",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "DHRUVA — Cinematic Portfolio",
      },
      {
        url: "/images/og-dark.svg",
        width: 1200,
        height: 630,
        alt: "DHRUVA — Cinematic Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DHRUVA - Cinematic Portfolio",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const heroPreload = heroPortraits[0]?.src;

  return (
    <html
      lang="en"
      className={cn(inter.variable, "h-full")}
      suppressHydrationWarning
    >
      <head>
        {heroPreload ? (
          <link
            rel="preload"
            href={heroPreload}
            as="image"
            type="image/webp"
            fetchPriority="high"
          />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <div
          id="theatre-boot"
          className="theatre-boot theatre-stage"
          aria-hidden="true"
        >
          <div className="theatre-stage__paper" />
          <div className="theatre-stage__vignette" />
          <div className="theatre-stage__grain" />
          <div className="theatre-stage__chrome">
            <span>Creative Portfolio</span>
            <span>Vol. 2026</span>
          </div>
          <div className="theatre-stage__center">
            <p className="theatre-stage__title">The Dhruva</p>
            <p className="theatre-stage__tagline">
              Curating high-performance
              <br />
              digital environments for the
              <br />
              avant-garde
            </p>
          </div>
          <div className="theatre-stage__enter">
            <span>Click or draw to enter</span>
            <svg
              className="theatre-stage__chevron"
              viewBox="0 0 16 10"
              fill="none"
            >
              <path
                d="M1.5 1.5L8 8.5L14.5 1.5"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('theatre-skip');var b=document.getElementById('theatre-boot');if(b)b.remove();}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <AnimationProvider>
            <TheatreIntroProvider>
              <SmoothScrollProvider>
                <InkProvider>{children}</InkProvider>
              </SmoothScrollProvider>
            </TheatreIntroProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
