"use client";

import { useTranslations } from "next-intl";
import { Controller, type UseFormReturn } from "react-hook-form";

import { ApplyDateField } from "@/components/apply/apply-date-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApplicationFormValues } from "@/lib/validation/application";

interface ApplyStepTwoProps {
  form: UseFormReturn<ApplicationFormValues>;
  consentChecked: boolean;
  onConsentChange: (checked: boolean) => void;
  consentError: boolean;
}

/**
 * Step 2 — "Your details": name, DOB, email, phone, plus the privacy-notice
 * consent checkbox. Consent is intentionally NOT part of `ApplicationFormValues`
 * — it has no backing column in `applications` and isn't in the future
 * /api/public-apply payload (see api-design.md); it's a UI-only gate on this
 * step's Continue button, per feature 08's minors'-data consent requirement.
 */
export function ApplyStepTwo({
  form,
  consentChecked,
  onConsentChange,
  consentError,
}: ApplyStepTwoProps) {
  const t = useTranslations("ApplyPage.form");
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
          <Input
            id="firstName"
            placeholder={t("firstNamePlaceholder")}
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
          <Input
            id="lastName"
            placeholder={t("lastNamePlaceholder")}
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateOfBirth">{t("dateOfBirthLabel")}</Label>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <ApplyDateField
              id="dateOfBirth"
              label={t("dateOfBirthLabel")}
              value={field.value ?? null}
              onChange={(value) => field.onChange(value ?? "")}
              placeholder={t("datePlaceholder")}
              error={!!errors.dateOfBirth}
            />
          )}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="privacyNotice"
            checked={consentChecked}
            aria-invalid={consentError}
            onCheckedChange={(checked) => onConsentChange(checked === true)}
          />
          <Label htmlFor="privacyNotice" className="font-normal">
            {t("privacyNoticeLabel")}
          </Label>
        </div>
        {consentError && (
          <p className="text-sm text-destructive">{t("privacyNoticeRequired")}</p>
        )}
      </div>
    </div>
  );
}
