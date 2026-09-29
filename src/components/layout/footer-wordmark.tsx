"use client";

import { MagneticText } from "@/components/ui/magnetic-text";

/** Interactive footer wordmark island — the only client part of the footer. */
export function FooterWordmark() {
  return <MagneticText text="DHRUVA" strength={7} radius={100} />;
}
