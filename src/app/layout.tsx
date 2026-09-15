import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/data";
import { heroPortraits } from "@/data";
import { inter } from "@/lib/fonts";
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
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "THE DHRUVA — Cinematic Digital Studio",
    template: "%s | THE DHRUVA",
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
    title: "THE DHRUVA — Cinematic Digital Studio",
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
        type: "image/png",
        alt: "THE DHRUVA — Cinematic Digital Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE DHRUVA — Cinematic Digital Studio",
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
  const hubSpotPortalId =
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? "247221692";

  return (
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning>
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
        <link
          rel="preconnect"
          href="https://js-na2.hs-scripts.com"
          crossOrigin="anonymous"
        />
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
        {hubSpotPortalId ? (
          <Script
            id="hs-script-loader"
            src={`https://js-na2.hs-scripts.com/${hubSpotPortalId}.js`}
            strategy="afterInteractive"
          />
        ) : null}
        <SpeedInsights sampleRate={0.5} />
      </body>
    </html>
  );
}
