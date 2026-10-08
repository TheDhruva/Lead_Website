"use client";

import { MEDIA_REDUCED_MOTION } from "@/constants/breakpoints";

import { useMediaQuery } from "./use-media-query";

export function useReducedMotion() {
  return useMediaQuery(MEDIA_REDUCED_MOTION);
}
