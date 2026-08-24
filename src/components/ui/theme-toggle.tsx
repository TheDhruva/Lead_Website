"use client";

import { useSyncExternalStore } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

function subscribe() {
  return () => undefined;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <span
        className={cn(
          variant === "icon" ? "inline-flex h-10 w-10" : "block h-12 w-full",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-foreground transition-all duration-[250ms] hover:bg-card-hover active:scale-[0.985] motion-reduce:active:scale-100",
          className,
        )}
      >
        <span className="font-label-md text-label-md">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          <Sun
            aria-hidden="true"
            className={cn(
              "absolute h-5 w-5 transition-all duration-[250ms] ease-out",
              isDark
                ? "rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100",
            )}
          />
          <Moon
            aria-hidden="true"
            className={cn(
              "absolute h-5 w-5 transition-all duration-[250ms] ease-out",
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-50 opacity-0",
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all duration-[250ms] hover:bg-card-hover active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          "absolute h-5 w-5 transition-all duration-[250ms] ease-out",
          isDark
            ? "rotate-90 scale-50 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          "absolute h-5 w-5 transition-all duration-[250ms] ease-out",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0",
        )}
      />
    </button>
  );
}
