export function ContactFormSkeleton() {
  return (
    <div
      className="flex flex-col gap-3.5 motion-reduce:animate-none animate-pulse"
      aria-busy="true"
      aria-label="Loading contact form"
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-12 rounded bg-foreground/[0.08]" />
          <div className="h-11 rounded-lg bg-foreground/[0.05]" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 rounded bg-foreground/[0.08]" />
          <div className="h-11 rounded-lg bg-foreground/[0.05]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-foreground/[0.08]" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-24 rounded-full bg-foreground/[0.05]"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-14 rounded bg-foreground/[0.08]" />
          <div className="h-20 rounded-lg bg-foreground/[0.05]" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-foreground/[0.08]" />
          <div className="h-20 rounded-lg bg-foreground/[0.05]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-foreground/[0.08]" />
        <div className="h-24 rounded-lg bg-foreground/[0.05]" />
      </div>
      <div className="mt-1 h-12 rounded-full bg-foreground/[0.07]" />
    </div>
  );
}
