import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:opacity-95 active:translate-y-0 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  ghost:
    "bg-transparent text-foreground border border-border hover:-translate-y-0.5 hover:bg-card-hover hover:border-border-hover active:translate-y-0 active:scale-[0.985]",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      type = "button",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        data-cursor="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full font-button text-button transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-colors",
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
