import { type TextareaHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

import {
  FIELD_CONTROL_CLASS,
  FIELD_CONTROL_ERROR_CLASS,
  FieldError,
  FieldLabel,
} from "./field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <div>
        <FieldLabel id={textareaId}>{label}</FieldLabel>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            FIELD_CONTROL_CLASS,
            // The textarea alone resizes vertically.
            "resize-y",
            error && FIELD_CONTROL_ERROR_CLASS,
            className,
          )}
          {...props}
        />
        <FieldError id={textareaId} message={error} />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
