"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
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

const INTRO_SEEN_KEY = "dhruva-intro-seen";

function readIntroSeen() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function TheatreIntroProvider({ children }: TheatreIntroProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [manuallyEntered, setManuallyEntered] = useState(false);
  const introPreviouslySeen = useSyncExternalStore(
    () => () => {},
    readIntroSeen,
    () => false,
  );

  const enter = useCallback(() => {
    setManuallyEntered(true);
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || manuallyEntered || introPreviouslySeen) return;

    const timeout = window.setTimeout(() => {
      setManuallyEntered(true);
    }, THEATRE_INTRO_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion, manuallyEntered, introPreviouslySeen]);

  const hasEntered =
    prefersReducedMotion || manuallyEntered || introPreviouslySeen;

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
