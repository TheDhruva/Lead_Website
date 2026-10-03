import { type ReactNode } from "react";

interface CssRevealProps {
  children: ReactNode;
  className?: string;
}

export function CssReveal({ children, className }: CssRevealProps) {
  return <div className={className}>{children}</div>;
}
