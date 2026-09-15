"use client";

import { useTranslations } from "next-intl";
import { Controller, type UseFormReturn } from "react-hook-form";

import { ApplyDateField } from "@/components/apply/apply-date-field";
import { ApplyPillRadioGroup } from "@/components/apply/apply-pill-radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplyBranch, ApplyProfession } from "@/lib/organization/apply-context";
import type { ApplicationFormValues } from "@/lib/validation/application";

interface ApplyStepOneProps {
  form: UseFormReturn<ApplicationFormValues>;
  professions: ApplyProfession[];
  branches: ApplyBranch[];
}

/** Step 1 — "Internship request": profession, branch (if >1), internship type, scope, requested dates. */
export function ApplyStepOne({ form, professions, branches }: ApplyStepOneProps) {
  const t = useTranslations("ApplyPage.form");
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const professionItems = Object.fromEntries(professions.map((p) => [p.organizationProfessionId, p.nameDe]));
  const branchItems = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const exactDateUnknown = watch("exactDateUnknown");

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="organizationProfessionId">{t("professionLabel")}</Label>
        <Controller
          control={control}
          name="organizationProfessionId"
          render={({ field }) => (
            <Select
              items={professionItems}
              value={field.value ?? null}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="organizationProfessionId"
                aria-invalid={!!errors.organizationProfessionId}
                className="w-full"
              >
                <SelectValue placeholder={t("professionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {professions.map((profession) => (
                  <SelectItem
                    key={profession.organizationProfessionId}
                    value={profession.organizationProfessionId}
                  >
                    {profession.nameDe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.organizationProfessionId && (
          <p className="text-sm text-destructive">{errors.organizationProfessionId.message}</p>
        )}
      </div>

      {branches.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="branchId">{t("branchLabel")}</Label>
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <Select items={branchItems} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="branchId" aria-invalid={!!errors.branchId} className="w-full">
                  <SelectValue placeholder={t("branchPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.branchId && <p className="text-sm text-destructive">{errors.branchId.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>{t("internshipTypeLabel")}</Label>
        <Controller
          control={control}
          name="internshipType"
          render={({ field }) => (
            <ApplyPillRadioGroup
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              error={!!errors.internshipType}
              options={[
                { value: "obligatory", label: t("internshipTypeObligatory") },
                { value: "voluntary", label: t("internshipTypeVoluntary") },
              ]}
            />
          )}
        />
        {errors.internshipType && (
          <p className="text-sm text-destructive">{errors.internshipType.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>{t("scopeLabel")}</Label>
        <Controller
          control={control}
          name="scope"
          render={({ field }) => (
            <ApplyPillRadioGroup
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              error={!!errors.scope}
              options={[
                { value: "single_profession", label: t("scopeSingleProfession") },
                { value: "orientierungspraktikum", label: t("scopeOrientierungspraktikum") },
              ]}
            />
          )}
        />
        {errors.scope && <p className="text-sm text-destructive">{errors.scope.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>{t("datesLabel")}</Label>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="requestedStartDate"
            render={({ field }) => (
              <ApplyDateField
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder={t("datesFromLabel")}
                disabled={exactDateUnknown}
                error={!!errors.requestedStartDate}
              />
            )}
          />
          <Controller
            control={control}
            name="requestedEndDate"
            render={({ field }) => (
              <ApplyDateField
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder={t("datesToLabel")}
                disabled={exactDateUnknown}
                error={!!errors.requestedEndDate}
              />
            )}
          />
        </div>
        {errors.requestedEndDate && (
          <p className="text-sm text-destructive">{errors.requestedEndDate.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="exactDateUnknown"
          render={({ field }) => (
            <Checkbox
              id="exactDateUnknown"
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (checked) {
                  setValue("requestedStartDate", null);
                  setValue("requestedEndDate", null);
                }
              }}
            />
          )}
        />
        <Label htmlFor="exactDateUnknown" className="font-normal">
          {t("exactDateUnknownLabel")}
        </Label>
      </div>
    </div>
  );
}
