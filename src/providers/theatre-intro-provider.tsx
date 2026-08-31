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

import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TheatreIntroContextValue {
  hasEntered: boolean;
  isReturning: boolean;
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

function applyTheatreDone() {
  setTheatreLock(false);
  document.documentElement.classList.add("theatre-done");
  document.documentElement.classList.remove("theatre-active");
  document.getElementById("theatre-boot")?.remove();
}

function setTheatreLock(locked: boolean) {
  document.documentElement.classList.toggle("theatre-locked", locked);
  document.body.style.overflow = locked ? "hidden" : "";
}

export function TheatreIntroProvider({ children }: TheatreIntroProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(false);
  const isReturning = useSyncExternalStore(
    () => () => {},
    readIntroSeen,
    () => false,
  );

  const skipIntro = prefersReducedMotion || isReturning;
  const entered = skipIntro || hasEntered;

  const enter = useCallback(() => {
    setHasEntered(true);
    applyTheatreDone();
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (!skipIntro) return;
    applyTheatreDone();
  }, [skipIntro]);

  useEffect(() => {
    if (entered) return;

    setTheatreLock(true);

    const blockScroll = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      setTheatreLock(false);
    };
  }, [entered]);

  const value = useMemo(
    () => ({
      hasEntered: entered,
      isReturning,
      enter,
    }),
    [entered, isReturning, enter],
  );

  return (
    <TheatreIntroContext.Provider value={value}>
      {children}
    </TheatreIntroContext.Provider>
  );
}
