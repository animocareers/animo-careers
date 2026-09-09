import { cn } from "@/lib/utils";

interface PricingNoteProps {
  badge: string;
  text: string;
  className?: string;
}

export function PricingNote({ badge, text, className }: PricingNoteProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center gap-2 rounded-3xl border bg-gradient-card px-6 py-4 text-center",
        className
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
        {badge}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
