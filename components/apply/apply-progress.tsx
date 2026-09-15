import { CheckIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ApplyProgressProps {
  step: 1 | 2 | 3;
  labels: readonly [string, string, string];
}

const STEP_NUMBERS = [1, 2, 3] as const;

/**
 * One shared step-progress indicator, responsive via Tailwind breakpoints
 * per feature 08 §3's recommendation (one implementation, not two): a dot +
 * connecting-line row on mobile (matching the screenshot), a
 * numbered/labeled stepper on desktop (`md:` and above). Purely decorative —
 * the accessible "Step X of 3" announcement lives in each step's own
 * heading text, not here.
 */
export function ApplyProgress({ step, labels }: ApplyProgressProps) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 md:hidden" aria-hidden="true">
        {STEP_NUMBERS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted",
              )}
            />
            {i < STEP_NUMBERS.length - 1 && (
              <span
                className={cn("h-px flex-1 transition-colors", s < step ? "bg-primary" : "bg-muted")}
              />
            )}
          </div>
        ))}
      </div>

      <ol className="mb-8 hidden items-center md:flex" aria-hidden="true">
        {STEP_NUMBERS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground",
                )}
              >
                {s < step ? <CheckIcon className="size-3.5" /> : s}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  s === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {labels[s - 1]}
              </span>
            </div>
            {i < STEP_NUMBERS.length - 1 && (
              <Separator className={cn("mx-3 flex-1", s < step && "bg-primary")} />
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
