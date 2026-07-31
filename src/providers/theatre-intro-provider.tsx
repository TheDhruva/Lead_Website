"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { THEATRE_INTRO_TIMEOUT_MS } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TheatreIntroContextValue {
  hasEntered: boolean;
  enter: () => void;
}

const TheatreIntroContext = createContext<TheatreIntroContextValue | null>(
  null,
);

export function useTheatreIntro() {
  const ctx = useContext(TheatreIntroContext);
  if (!ctx) {
    throw new Error("useTheatreIntro must be used within TheatreIntroProvider");
  }
  return ctx;
}

interface TheatreIntroProviderProps {
  children: ReactNode;
}

export function TheatreIntroProvider({ children }: TheatreIntroProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [manuallyEntered, setManuallyEntered] = useState(false);

  const enter = useCallback(() => {
    setManuallyEntered(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || manuallyEntered) return;

    const timeout = window.setTimeout(() => {
      setManuallyEntered(true);
    }, THEATRE_INTRO_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion, manuallyEntered]);

  const hasEntered = prefersReducedMotion || manuallyEntered;

  const value = useMemo(
    () => ({
      hasEntered,
      enter,
    }),
    [hasEntered, enter],
  );

  return (
    <TheatreIntroContext.Provider value={value}>
      {children}
    </TheatreIntroContext.Provider>
  );
}
