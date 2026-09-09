import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EyebrowBadgeProps {
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

export function EyebrowBadge({ icon: Icon, className, children }: EyebrowBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary",
        className
      )}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </div>
  );
}
