"use client";

import { type ReactNode, useEffect } from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";

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
