import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/data";
import { heroPortraits } from "@/data";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
  AnimationProvider,
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
    icon: [{ url: "/favicon.png" }],
    shortcut: ["/favicon.png"],
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
        <ThemeProvider>
          <AnimationProvider>
            <TheatreIntroProvider>
              <SmoothScrollProvider>{children}</SmoothScrollProvider>
            </TheatreIntroProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
