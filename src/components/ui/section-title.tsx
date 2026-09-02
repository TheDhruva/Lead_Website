import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  align?: "left" | "center";
  id?: string;
}

export function SectionTitle({
  children,
  as: Tag = "h2",
  className,
  align = "center",
  id,
}: SectionTitleProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "mb-5 font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground md:mb-8 md:text-[34px] lg:text-[36px]",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
