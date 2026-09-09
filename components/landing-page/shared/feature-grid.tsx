import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type FeatureGridColor =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "student"
  | "company"
  | "school"
  | "partner";

const colorClasses: Record<FeatureGridColor, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  student: "bg-student/10 text-student",
  company: "bg-company/10 text-company",
  school: "bg-school/10 text-school",
  partner: "bg-partner/10 text-partner",
};

export interface FeatureGridItem {
  icon: LucideIcon;
  color?: FeatureGridColor;
  title: string;
  description: string;
}

interface FeatureGridProps {
  items: FeatureGridItem[];
  heading?: string;
  subheading?: string;
  className?: string;
}

export function FeatureGrid({ items, heading, subheading, className }: FeatureGridProps) {
  return (
    <section className={cn("container py-16 md:py-24", className)}>
      {(heading || subheading) && (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {heading && <h2 className="text-3xl md:text-4xl">{heading}</h2>}
          {subheading && (
            <p className="mt-4 text-lg text-muted-foreground">{subheading}</p>
          )}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex flex-col items-start gap-4 rounded-3xl border bg-card p-8 shadow-card"
            >
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl",
                  colorClasses[item.color ?? "primary"]
                )}
              >
                <Icon className="size-7" />
              </div>
              <h3 className="text-xl">{item.title}</h3>
              <p className="leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
