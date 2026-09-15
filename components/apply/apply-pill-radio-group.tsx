"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ApplyPillRadioOption {
  value: string;
  label: string;
}

interface ApplyPillRadioGroupProps {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: ApplyPillRadioOption[];
  error?: boolean;
}

/** A 2-up grid of bordered pill options with a radio-dot indicator, matching the screenshot's "Internship type" / "Scope" toggles. */
export function ApplyPillRadioGroup({
  name,
  value,
  onChange,
  options,
  error,
}: ApplyPillRadioGroupProps) {
  return (
    <RadioGroup
      name={name}
      value={value ?? null}
      onValueChange={(next) => onChange(String(next))}
      aria-invalid={!!error}
      className={cn("grid grid-cols-2 gap-3", error && "text-destructive")}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm font-medium transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5",
            error && "border-destructive",
          )}
        >
          <RadioGroupItem value={option.value} />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  );
}
