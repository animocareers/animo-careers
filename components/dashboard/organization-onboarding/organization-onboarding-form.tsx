"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createOrganization } from "@/app/[locale]/dashboard/actions";
import { ProfessionMultiSelect, type ProfessionOption } from "@/components/dashboard/organization-onboarding/profession-multi-select";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { INDUSTRY_TYPES } from "@/lib/constants/industries";
import { createOrganizationSchema, type OrganizationFormValues } from "@/lib/validation/organization";

interface OrganizationOnboardingFormProps {
  locale: string;
  professions: ProfessionOption[];
}

/** Renders the org-creation form shown in place of dashboard content until an organization exists. */
export function OrganizationOnboardingForm({
  locale,
  professions,
}: OrganizationOnboardingFormProps) {
  const tPage = useTranslations("OrganizationOnboarding");
  const t = useTranslations("OrganizationOnboarding.form");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema(t)),
    defaultValues: { professionIds: [] },
  });

  // Select's displayed value can only resolve a label from its `items` map —
  // without it, a value shown before the popup has ever opened falls back to
  // the raw enum value instead of its translated label.
  const industryItems = Object.fromEntries(
    INDUSTRY_TYPES.map((type) => [type, tPage(`industryTypes.${type}`)]),
  );

  const isBusy = isSubmitting || isNavigating;

  /** Submits the organization details and surfaces any server-side error. */
  async function onSubmit(values: OrganizationFormValues) {
    setFormError(null);
    const result = await createOrganization(locale, values);
    if (result.status === "error") {
      setFormError(result.message);
      return;
    }
    toast.success(t("createdToast"));
    // Navigate to a genuinely different route (rather than router.refresh()
    // on this same /dashboard URL) so Next.js re-runs dashboard/layout.tsx
    // fresh for it: the membership check there now finds the organization
    // just created and renders the settings page normally, instead of the
    // onboarding sheet being swapped out in place for a blank dashboard.
    startNavigation(() => {
      router.push("/dashboard/settings/organization");
    });
  }

  return (
    <>
      {isBusy && <LoadingOverlay label={t("submitting")} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("namePlaceholder")}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="street">{t("streetLabel")}</Label>
          <Input
            id="street"
            placeholder={t("streetPlaceholder")}
            aria-invalid={!!errors.street}
            {...register("street")}
          />
          {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="postalCode">{t("postalCodeLabel")}</Label>
            <Input
              id="postalCode"
              placeholder={t("postalCodePlaceholder")}
              aria-invalid={!!errors.postalCode}
              {...register("postalCode")}
            />
            {errors.postalCode && (
              <p className="text-sm text-destructive">{errors.postalCode.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">{t("cityLabel")}</Label>
            <Input
              id="city"
              placeholder={t("cityPlaceholder")}
              aria-invalid={!!errors.city}
              {...register("city")}
            />
            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">{t("countryLabel")}</Label>
          <Input
            id="country"
            placeholder={t("countryPlaceholder")}
            aria-invalid={!!errors.country}
            {...register("country")}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industryType">{t("industryTypeLabel")}</Label>
          <Controller
            control={control}
            name="industryType"
            render={({ field }) => (
              <Select items={industryItems} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger
                  id="industryType"
                  aria-invalid={!!errors.industryType}
                  className="w-full"
                >
                  <SelectValue placeholder={t("industryTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tPage(`industryTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.industryType && (
            <p className="text-sm text-destructive">{errors.industryType.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("professionsLabel")}</Label>
          <Controller
            control={control}
            name="professionIds"
            render={({ field }) => (
              <ProfessionMultiSelect
                professions={professions}
                value={field.value ?? []}
                onChange={field.onChange}
                error={!!errors.professionIds}
              />
            )}
          />
          {errors.professionIds && (
            <p className="text-sm text-destructive">{errors.professionIds.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button type="submit" disabled={isBusy} className="w-full">
          {t("submit")}
        </Button>
      </form>
    </>
  );
}
