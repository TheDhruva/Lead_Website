import { type SelectHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <div>
        <label
          htmlFor={selectId}
          className="mb-2 block font-label-md text-label-md text-foreground-secondary"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            "w-full rounded-lg border border-input-border bg-input px-4 py-3 text-foreground transition-colors duration-[250ms] focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
            error && "border-error focus:border-error focus:ring-error",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p
            id={`${selectId}-error`}
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

Select.displayName = "Select";
