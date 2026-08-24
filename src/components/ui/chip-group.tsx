"use client";

import { cn } from "@/lib/utils";

interface ChipGroupProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  name: string;
}

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  error,
  name,
}: ChipGroupProps) {
  const labelId = `${name}-label`;
  const errorId = `${name}-error`;

  return (
    <fieldset
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
    >
      <legend
        id={labelId}
        className="mb-3 block font-label-md text-label-md text-foreground-secondary"
      >
        {label}
      </legend>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((option) => {
          const selected = value === option;
          const optionId = `${name}-${option.replace(/\s+/g, "-").toLowerCase()}`;

          return (
            <button
              key={option}
              id={optionId}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border px-3.5 py-2 font-label-md text-sm transition-all duration-[250ms] ease-out",
                "active:scale-[0.985] motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  : "border-border bg-transparent text-foreground-secondary hover:border-border-hover hover:bg-card-hover hover:text-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
