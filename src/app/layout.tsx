import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/data";
import { heroPortraits, videoItems } from "@/data";
import { anton, instrumentSerif, manrope } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
  AnimationProvider,
  AudioProvider,
  PointerEngineProvider,
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
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#171211" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "The Dhruva",
    template: "%s | The Dhruva",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  keywords: [
    "DHRUVA",
    "video editing",
    "cinematic portfolio",
    "website development",
    "graphic design",
    "brand identity",
    "motion design",
    "video production",
  ],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "The Dhruva",
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
        type: "image/jpeg",
        alt: "The Dhruva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Dhruva",
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
    // Single bright-mode logo — no media-selected variants.
    icon: [{ url: "/favicon-light.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

const structuredData: Record<string, unknown>[] = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: `${siteConfig.url}/favicon.png`,
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.youtube,
      siteConfig.links.linkedin,
      siteConfig.links.github,
      siteConfig.links.twitter,
    ].filter(
      (href): href is string =>
        typeof href === "string" && href.startsWith("http"),
    ),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en",
  },
];

export default function RootLayout({ children }: RootLayoutProps) {
  const heroPreload = heroPortraits[0]?.src;
  // P1: first video poster only (never video files) — warms the video
  // section's cold entry without competing with LCP.
  const firstVideoPoster = videoItems[0]?.poster;

  return (
    <html
      lang="en"
      className={cn(manrope.variable, instrumentSerif.variable, anton.variable)}
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
        {firstVideoPoster ? (
          <link
            rel="preload"
            href={firstVideoPoster}
            as="image"
            type="image/webp"
            fetchPriority="low"
          />
        ) : null}
        {/* Basic layout must never depend on JavaScript. */}
        <noscript>
          <style>{`.st{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <div
          id="theatre-boot"
          className="theatre-boot theatre-curtain"
          aria-hidden="true"
          suppressHydrationWarning
        />
        <Script
          id="theatre-intro-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('theatre-skip','theatre-done');return;}var t=localStorage.getItem('dhruva-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){r.classList.add('dark');}r.classList.add('theatre-active','theatre-locked');}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <AnimationProvider>
            <TheatreIntroProvider>
              <AudioProvider>
                <SmoothScrollProvider>
                  <PointerEngineProvider>{children}</PointerEngineProvider>
                </SmoothScrollProvider>
              </AudioProvider>
            </TheatreIntroProvider>
          </AnimationProvider>
        </ThemeProvider>
        <JsonLd data={structuredData} />
        {process.env.NODE_ENV === "production" ? (
          <>
            <Analytics />
            <SpeedInsights sampleRate={0.1} />
          </>
        ) : null}
      </body>
    </html>
  );
}
