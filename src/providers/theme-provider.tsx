"use client";

import { type ReactNode, useEffect } from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * next-themes injects an inline <script> to prevent theme flash.
 * React 19 / Next 16 warns about script tags inside client components;
 * the script still runs correctly during SSR (false positive).
 * @see https://github.com/shadcn-ui/ui/issues/10104
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (message.includes("Encountered a script tag")) return;
    originalError.apply(console, args);
  };
}

/** Enables color transitions after first paint to avoid theme flash. */
function ThemeTransitionGate() {
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-ready");
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="dhruva-theme"
      disableTransitionOnChange={false}
    >
      <ThemeTransitionGate />
      {children}
    </NextThemesProvider>
  );
}
