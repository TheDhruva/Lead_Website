import type { ReactNode } from "react";

/**
 * Field ownership — the single source of truth for labelled form controls.
 *
 * `Input` and `Textarea` share this shell: one label treatment, one error
 * treatment, one control base. The controls add only their element-specific
 * behavior (input vs textarea + `resize-y`); density, radii, and focus
 * language live here so the two can never drift apart again.
 */

export const FIELD_LABEL_CLASS =
  "mb-2 block font-sans text-[13px] font-medium text-foreground";

export const FIELD_CONTROL_CLASS =
  "w-full rounded-lg border border-input-border bg-input px-4 py-3 text-foreground transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

export const FIELD_CONTROL_ERROR_CLASS =
  "border-error focus:border-error focus:ring-error";

export function FieldLabel({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className={FIELD_LABEL_CLASS}>
      {children}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-error">
      {message}
    </p>
  );
}
