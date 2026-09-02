"use client";

import { type HTMLAttributes, type ReactNode, memo } from "react";

import { cn } from "@/lib/utils";

interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function PageTransitionComponent({
  children,
  className,
  ...props
}: PageTransitionProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export const PageTransition = memo(PageTransitionComponent);
