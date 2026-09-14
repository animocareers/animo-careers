"use client";

import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MAX_PROFESSIONS } from "@/lib/validation/organization";

export interface ProfessionOption {
  id: string;
  name_de: string;
}

interface ProfessionMultiSelectProps {
  professions: ProfessionOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: boolean;
}

/** Searchable multi-select for choosing 2-15 professions from the catalog. */
export function ProfessionMultiSelect({
  professions,
  value,
  onChange,
  error,
}: ProfessionMultiSelectProps) {
  const t = useTranslations("OrganizationOnboarding.form");
  const [open, setOpen] = useState(false);

  const selected = professions.filter((profession) => value.includes(profession.id));

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    if (value.length >= MAX_PROFESSIONS) return;
    onChange([...value, id]);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-invalid={!!error}
              className="w-full justify-between font-normal"
            >
              <span className="text-muted-foreground">
                {value.length === 0
                  ? t("professionsPlaceholder")
                  : t("professionsSelectedCount", { count: value.length, max: MAX_PROFESSIONS })}
              </span>
              <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={t("professionsSearchPlaceholder")} />
            <CommandList>
              <CommandEmpty>{t("professionsEmpty")}</CommandEmpty>
              <CommandGroup>
                {professions.map((profession) => {
                  const checked = value.includes(profession.id);
                  const disabled = !checked && value.length >= MAX_PROFESSIONS;
                  return (
                    <CommandItem
                      key={profession.id}
                      value={profession.name_de}
                      disabled={disabled}
                      data-checked={checked ? "true" : undefined}
                      onSelect={() => toggle(profession.id)}
                    >
                      {profession.name_de}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((profession) => (
            <Badge key={profession.id} variant="secondary" className="gap-1 pr-1">
              {profession.name_de}
              <button
                type="button"
                onClick={() => toggle(profession.id)}
                aria-label={t("removeProfession", { name: profession.name_de })}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
