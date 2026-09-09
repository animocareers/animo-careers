import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface CtaSectionProps {
  heading: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

export function CtaSection({
  heading,
  description,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  className,
}: CtaSectionProps) {
  return (
    <section className={cn("container pb-20 md:pb-28", className)}>
      <div className="bg-mesh rounded-4xl border p-10 text-center shadow-card md:p-16">
        <h2 className="text-3xl md:text-4xl">{heading}</h2>
        {description && (
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            className="min-h-14 rounded-full bg-gradient-primary px-8 text-base shadow-button transition-transform hover:scale-105"
            render={
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-2 size-5" />
              </Link>
            }
          />
          {secondaryLabel && secondaryHref && (
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              className="min-h-14 rounded-full px-8 text-base"
              render={<Link href={secondaryHref}>{secondaryLabel}</Link>}
            />
          )}
        </div>
      </div>
    </section>
  );
}
