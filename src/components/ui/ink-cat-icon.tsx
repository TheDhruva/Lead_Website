import { cn } from "@/lib/utils";

interface InkCatIconProps {
  className?: string;
  /** Accent color for the pen tip */
  tipColor?: string;
}

/** Cute cat in round glasses, holding a fountain pen. */
export function InkCatIcon({
  className,
  tipColor = "currentColor",
}: InkCatIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      {/* Ears */}
      <path
        d="M7.2 13.2 5.1 5.8c-.15-.55.45-1 .9-.7L11 8.4"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M24.8 13.2 26.9 5.8c.15-.55-.45-1-.9-.7L21 8.4"
        fill="currentColor"
        opacity="0.92"
      />
      {/* Head */}
      <ellipse cx="16" cy="16.2" rx="9.2" ry="8.4" fill="currentColor" />
      {/* Inner face cut for glasses contrast */}
      <ellipse
        cx="16"
        cy="16.6"
        rx="7.4"
        ry="6.4"
        fill="var(--background, #fafafa)"
        className="ink-cat-face"
      />
      {/* Glasses */}
      <circle
        cx="12.2"
        cy="15.6"
        r="3.15"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle
        cx="19.8"
        cy="15.6"
        r="3.15"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M15.35 15.6h1.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Pupils looking at the pen */}
      <circle cx="13.1" cy="15.9" r="1.05" fill="currentColor" />
      <circle cx="20.7" cy="15.9" r="1.05" fill="currentColor" />
      {/* Tiny nose */}
      <path
        d="M15.35 18.35c.35.45.95.45 1.3 0"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {/* Soft smile */}
      <path
        d="M14.4 20.1c.9.7 2.3.7 3.2 0"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      {/* Pen */}
      <path
        d="M22.6 21.2 27.8 12.4"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M27.15 11.55 28.55 13.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M22.2 21.85 20.55 24.4l2.7-.55z" fill={tipColor} />
      {/* Paw holding pen */}
      <ellipse cx="21.5" cy="21.5" rx="2.1" ry="1.55" fill="currentColor" />
    </svg>
  );
}
