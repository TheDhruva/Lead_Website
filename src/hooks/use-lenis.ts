"use client";

import { useSyncExternalStore } from "react";

import type Lenis from "lenis";

import { useLenisContext } from "@/providers/smooth-scroll-provider";

export function useLenis(): Lenis | null {
  return useLenisContext();
}

export function useIsMounted() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
