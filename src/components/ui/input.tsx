import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

import {
  FIELD_CONTROL_CLASS,
  FIELD_CONTROL_ERROR_CLASS,
  FieldError,
  FieldLabel,
} from "./field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div>
        <FieldLabel id={inputId}>{label}</FieldLabel>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            FIELD_CONTROL_CLASS,
            error && FIELD_CONTROL_ERROR_CLASS,
            className,
          )}
          {...props}
        />
        <FieldError id={inputId} message={error} />
      </div>
    );
  },
);

Input.displayName = "Input";
