import { type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

function RevealComponent({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>;
}

export const Reveal = RevealComponent;
