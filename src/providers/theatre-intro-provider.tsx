"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

interface TheatreIntroContextValue {
  hasEntered: boolean;
  isReturning: boolean;
  bootstrapped: boolean;
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

type IntroBootState = {
  bootstrapped: boolean;
  hasEntered: boolean;
  isReturning: boolean;
};

const INITIAL_INTRO: IntroBootState = {
  bootstrapped: false,
  hasEntered: false,
  isReturning: false,
};

function readIntroSeen() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function applyTheatreDone() {
  setTheatreLock(false);
  const root = document.documentElement;
  root.classList.add("theatre-done");
  root.classList.remove("theatre-active");
  document.getElementById("theatre-boot")?.remove();
}

function setTheatreLock(locked: boolean) {
  document.documentElement.classList.toggle("theatre-locked", locked);
  document.body.style.overflow = locked ? "hidden" : "";
}

function computeIntroState(): IntroBootState {
  const returning = readIntroSeen();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    applyTheatreDone();
    return {
      bootstrapped: true,
      isReturning: false,
      hasEntered: true,
    };
  }

  setTheatreLock(true);
  document.documentElement.classList.add("theatre-active");

  return {
    bootstrapped: true,
    isReturning: returning,
    hasEntered: false,
  };
}

let introSnapshot: IntroBootState = INITIAL_INTRO;
let introInitialized = false;
const introListeners = new Set<() => void>();

function emitIntroChange() {
  for (const listener of introListeners) {
    listener();
  }
}

function bootstrapIntro() {
  if (introInitialized || typeof window === "undefined") return;
  introInitialized = true;
  introSnapshot = computeIntroState();
  emitIntroChange();
}

function subscribeIntro(listener: () => void) {
  introListeners.add(listener);

  queueMicrotask(() => {
    bootstrapIntro();
  });

  return () => {
    introListeners.delete(listener);
  };
}

function getIntroSnapshot() {
  return introSnapshot;
}

function getIntroServerSnapshot() {
  return INITIAL_INTRO;
}

export function TheatreIntroProvider({ children }: TheatreIntroProviderProps) {
  const intro = useSyncExternalStore(
    subscribeIntro,
    getIntroSnapshot,
    getIntroServerSnapshot,
  );

  const enter = useCallback(() => {
    introSnapshot = { ...introSnapshot, hasEntered: true };
    applyTheatreDone();
    emitIntroChange();
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (!intro.bootstrapped || intro.hasEntered) return;

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
  }, [intro.bootstrapped, intro.hasEntered]);

  const value = useMemo(
    () => ({
      hasEntered: intro.hasEntered,
      isReturning: intro.isReturning,
      bootstrapped: intro.bootstrapped,
      enter,
    }),
    [intro, enter],
  );

  return (
    <TheatreIntroContext.Provider value={value}>
      {children}
    </TheatreIntroContext.Provider>
  );
}
