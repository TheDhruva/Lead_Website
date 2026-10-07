"use client";

import { SECTION_IDS } from "@/constants";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

const SECTION_LIST = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

/**
 * GlobalCanvas — one continuous atmosphere behind all content.
 *
 * A SINGLE static wash layer (merged section gradients on one element)
 * whose opacity follows the active section through CSS only: no scroll
 * listeners with React state, no per-frame work, no layout, and only
 * one fullscreen surface to composite. Sections themselves stay
 * transparent so chapters blend instead of cutting.
 *
 * Layer order: BACKGROUND → WASH → CONTENT → NAVIGATION.
 */
export function GlobalCanvas({ className }: { className?: string }) {
  const { activeId } = useActiveSection(SECTION_LIST);

  return (
    <div
      className={cn("global-canvas", className)}
      data-wash={activeId}
      aria-hidden="true"
    >
      <div className="global-canvas__wash" />
    </div>
  );
}
