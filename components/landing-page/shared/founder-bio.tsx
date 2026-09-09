import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FounderBioProps {
  initials: string;
  name?: string;
  role?: string;
  quote?: string;
  quoteAs?: "h1" | "p";
  size?: "md" | "lg";
  children?: ReactNode;
  className?: string;
}

export function FounderBio({
  initials,
  name,
  role,
  quote,
  quoteAs = "p",
  size = "md",
  children,
  className,
}: FounderBioProps) {
  const QuoteTag = quoteAs;

  return (
    <div className={cn("flex flex-col items-center gap-6 text-center", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-primary font-heading font-black text-primary-foreground shadow-glow",
          size === "lg" ? "size-40 text-4xl" : "size-24 text-2xl"
        )}
        aria-hidden="true"
      >
        {initials}
      </div>
      {quote && (
        <QuoteTag
          className={cn(
            "max-w-xl font-sans leading-relaxed font-normal tracking-normal text-muted-foreground italic",
            quoteAs === "h1" ? "text-2xl md:text-3xl" : "text-lg"
          )}
        >
          &ldquo;{quote}&rdquo;
        </QuoteTag>
      )}
      {(name || role) && (
        <div>
          {name && <p className="font-heading text-lg">{name}</p>}
          {role && <p className="text-sm text-muted-foreground">{role}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
