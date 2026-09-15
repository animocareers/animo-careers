"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateOrganization } from "@/app/[locale]/dashboard/settings/organization/actions";
import {
  ProfessionMultiSelect,
  type ProfessionOption,
} from "@/components/dashboard/organization-onboarding/profession-multi-select";
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
import { INDUSTRY_TYPES } from "@/lib/constants/industries";
import { createOrganizationSchema, type OrganizationFormValues } from "@/lib/validation/organization";

interface OrganizationSettingsFormProps {
  locale: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    address: { street?: string; postalCode?: string; city?: string; country?: string } | null;
    industry_type: string | null;
  };
  applyLink: string;
  professions: ProfessionOption[];
  professionIds: string[];
}

/** Views and edits the caller's organization details, offered professions, and a copyable public apply link. */
export function OrganizationSettingsForm({
  locale,
  organization,
  applyLink,
  professions,
  professionIds,
}: OrganizationSettingsFormProps) {
  const tSettings = useTranslations("OrganizationSettings");
  const tPage = useTranslations("OrganizationOnboarding");
  const t = useTranslations("OrganizationOnboarding.form");
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema(t)),
    defaultValues: {
      name: organization.name,
      street: organization.address?.street ?? "",
      postalCode: organization.address?.postalCode ?? "",
      city: organization.address?.city ?? "",
      country: organization.address?.country ?? "",
      industryType: (organization.industry_type ?? undefined) as OrganizationFormValues["industryType"],
      professionIds,
    },
  });

  // Select's displayed value can only resolve a label from its `items` map —
  // without it, a value set before the popup has ever opened (e.g. this
  // pre-filled edit form) falls back to showing the raw enum value.
  const industryItems = Object.fromEntries(
    INDUSTRY_TYPES.map((type) => [type, tPage(`industryTypes.${type}`)]),
  );

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  /** Submits the edited organization details and surfaces any server-side error. */
  async function onSubmit(values: OrganizationFormValues) {
    setFormError(null);
    const result = await updateOrganization(locale, values);
    if (result.status === "error") {
      setFormError(result.message);
      return;
    }
    toast.success(tSettings("savedToast"));
  }

  /** Copies the apply link to the clipboard, falling back to a toast if the Clipboard API is unavailable. */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(applyLink);
      setCopied(true);
    } catch {
      toast.error(tSettings("copyFailed"));
    }
  }

  return (
    <div className="space-y-8">
      {isSubmitting && <LoadingOverlay label={tSettings("saving")} />}

      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-black tracking-tight">{tSettings("heading")}</h1>
        <p className="text-sm text-muted-foreground">{tSettings("description")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="applyLink">{tSettings("applyLinkLabel")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="applyLink"
            readOnly
            value={applyLink}
            className="bg-muted text-muted-foreground"
          />
          <Button type="button" variant="outline" onClick={() => void handleCopy()}>
            {copied ? (
              <>
                <CheckIcon data-icon="inline-start" />
                {tSettings("copied")}
              </>
            ) : (
              <>
                <CopyIcon data-icon="inline-start" />
                {tSettings("copy")}
              </>
            )}
          </Button>
        </div>
      </div>

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

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {tSettings("save")}
        </Button>
      </form>
    </div>
  );
}
