"use client";

import { de, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatGermanDate, fromIsoDate, toIsoDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface ApplyDateFieldProps {
  id?: string;
  /** Accessible name for the trigger button — falls back to `placeholder` when omitted. Needed on the from/to pair, where the visible text becomes just a date (losing "from"/"to") once a value is picked. */
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}

/** Shared Calendar+Popover date-picker (per feature 08 §6 — not a native `<input type="date">`), used for DOB and the requested start/end dates. Displays in German date format regardless of locale, since the ISO value is what's actually validated/submitted. */
export function ApplyDateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  error,
}: ApplyDateFieldProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const selected = value ? fromIsoDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={!!error}
            aria-label={label ?? placeholder}
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {selected ? formatGermanDate(selected) : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 100, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          locale={locale === "de" ? de : enUS}
          selected={selected}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
