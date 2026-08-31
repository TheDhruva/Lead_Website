import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type SectionTone = "services" | "videos" | "projects";

const toneClasses: Record<SectionTone, string> = {
  services: "section-tone-services",
  videos: "section-tone-videos",
  projects: "section-tone-projects",
};

interface SectionSkeletonProps {
  tone: SectionTone;
  id?: string;
}

export function SectionSkeleton({ tone, id }: SectionSkeletonProps) {
  return (
    <section
      id={id}
      className={cn(
        "section-frame motion-reduce:animate-none animate-pulse",
        toneClasses[tone],
      )}
      aria-busy="true"
      aria-label="Loading section"
    >
      <Container className="flex w-full flex-col gap-6">
        <div className="h-9 w-44 rounded-lg bg-foreground/[0.07]" />
        {tone === "services" ? (
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="min-h-[120px] flex-1 rounded-2xl bg-foreground/[0.05] md:min-h-[280px]"
              />
            ))}
          </div>
        ) : null}
        {tone === "videos" ? (
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1.12fr]">
            <div className="min-h-[220px] rounded-2xl bg-foreground/[0.05] lg:row-span-3 lg:min-h-0" />
            <div className="min-h-[120px] rounded-2xl bg-foreground/[0.05]" />
            <div className="min-h-[120px] rounded-2xl bg-foreground/[0.05]" />
          </div>
        ) : null}
        {tone === "projects" ? (
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
            <div className="min-h-[200px] rounded-2xl bg-foreground/[0.05] lg:min-h-[320px]" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="aspect-square rounded-2xl bg-foreground/[0.05] lg:aspect-auto lg:min-h-[150px]" />
              <div className="aspect-square rounded-2xl bg-foreground/[0.05] lg:aspect-auto lg:min-h-[150px]" />
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
