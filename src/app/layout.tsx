import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { SpeedInsights } from "@vercel/speed-insights/next";

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
        <Script
          id="hs-script-loader"
          src="https://js-na2.hs-scripts.com/247221692.js"
          strategy="lazyOnload"
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
