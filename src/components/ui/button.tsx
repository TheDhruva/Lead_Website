"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { useSfxHandlers } from "@/hooks/use-sfx-handlers";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Play UI hover/click sounds when audio is unlocked */
  sfx?: boolean;
}

/**
 * Phase 1 editorial button language.
 * - Primary: Lacquer bg, Paper text, subtle lift on hover
 * - Secondary: transparent/Paper, Ink text, 1px border
 * - Ghost: no border, muted text, subtle hover
 * Restrained shadows, 10–14px radius (pills reserved for nav/tags).
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-lacquer text-paper border border-lacquer shadow-[var(--shadow-sm)] hover:bg-bright-lacquer hover:border-bright-lacquer hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.985] dark:bg-bright-lacquer dark:border-bright-lacquer dark:hover:bg-lacquer dark:hover:border-lacquer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  secondary:
    "bg-transparent text-foreground border border-border hover:-translate-y-px hover:bg-card-hover hover:border-border-hover hover:text-foreground active:translate-y-0 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  ghost:
    "bg-transparent border border-transparent text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 py-2 text-[13px]",
  md: "min-h-11 px-6 py-3 text-[14px]",
  lg: "min-h-12 px-8 py-4 text-[15px]",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      sfx = false,
      type = "button",
      disabled,
      children,
      onMouseEnter,
      onFocus,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { onHover, onClick: playClick } = useSfxHandlers();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          if (sfx) onHover();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (sfx) onHover();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (sfx) playClick();
        }}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-sans text-sm font-semibold tracking-[0.04em] whitespace-nowrap uppercase transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
