import { type TextareaHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <div>
        <label
          htmlFor={textareaId}
          className="mb-2 block font-label-md text-label-md text-foreground-secondary"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            "w-full resize-y rounded-lg border border-input-border bg-input px-4 py-3 text-foreground transition-[border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            error && "border-error focus:border-error focus:ring-error",
            className,
          )}
          {...props}
        />
        {error ? (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="mt-2 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
