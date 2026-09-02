"use client";

import { type KeyboardEvent, useRef } from "react";

import { cn } from "@/lib/utils";

interface ChipGroupProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  name: string;
  compact?: boolean;
}

function optionId(name: string, option: string) {
  return `${name}-${option.replace(/\s+/g, "-").toLowerCase()}`;
}

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  error,
  name,
  compact = false,
}: ChipGroupProps) {
  const labelId = `${name}-label`;
  const errorId = `${name}-error`;
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusOption = (option: string) => {
    buttonRefs.current.get(option)?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = options.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        onChange(options[index]!);
        return;
      default:
        return;
    }

    event.preventDefault();
    const nextOption = options[nextIndex!]!;
    onChange(nextOption);
    focusOption(nextOption);
  };

  return (
    <fieldset
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
    >
      <legend
        id={labelId}
        className={cn(
          "block font-label-md text-label-md text-foreground-secondary",
          compact ? "mb-2" : "mb-3",
        )}
      >
        {label}
      </legend>
      <div
        className={cn(
          "flex flex-wrap",
          compact ? "gap-1.5 max-md:gap-1.25" : "gap-2",
        )}
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((option, index) => {
          const selected = value === option;
          const id = optionId(name, option);

          return (
            <button
              key={option}
              id={id}
              ref={(node) => {
                if (node) buttonRefs.current.set(option, node);
                else buttonRefs.current.delete(option);
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "rounded-full border font-label-md transition-all duration-[250ms] ease-out",
                "active:scale-[0.985] motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                compact
                  ? "min-h-[44px] px-3 py-2 text-xs"
                  : "min-h-[44px] px-3.5 py-2 text-sm",
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
