import { resolveSectionId } from "@/constants";

const MOUNT_EVENT = "dhruva:mount-section";

export function requestLazySectionMount(sectionId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MOUNT_EVENT, {
      detail: { sectionId: resolveSectionId(sectionId) },
    }),
  );
}

export function subscribeLazySectionMount(
  sectionId: string,
  onMount: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const resolved = resolveSectionId(sectionId);

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ sectionId?: string }>).detail;
    if (detail?.sectionId === resolved) {
      onMount();
    }
  };

  window.addEventListener(MOUNT_EVENT, handler);
  return () => window.removeEventListener(MOUNT_EVENT, handler);
}

export function hashTargetsSection(sectionId: string | undefined): boolean {
  if (typeof window === "undefined" || !sectionId) return false;
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  return resolveSectionId(hash) === resolveSectionId(sectionId);
}
