/**
 * Deck geometry channel — lets the scroll-settle logic snap to exact
 * card boundaries without importing the Projects component (import
 * direction stays component → lib, never the reverse).
 *
 * StackDeck publishes its measured { start, travel, count } whenever
 * it measures (mount / resize / font settle); the settle logic
 * consumes it at idle time only — never on the scroll hot path.
 * Null while the deck is unmounted (e.g. reduced-motion static list),
 * in which case settling falls back to plain section behavior.
 */

export interface DeckGeometry {
  /** Content-space top of the deck track (px from scroll origin). */
  start: number;
  /** Scrollable travel across the whole deck (trackH - viewportH). */
  travel: number;
  /** Number of cards sharing the travel (boundaries at i/count). */
  count: number;
}

let geometry: DeckGeometry | null = null;

export function setDeckGeometry(next: DeckGeometry): void {
  geometry = next;
}

export function clearDeckGeometry(): void {
  geometry = null;
}

export function getDeckGeometry(): DeckGeometry | null {
  return geometry;
}
