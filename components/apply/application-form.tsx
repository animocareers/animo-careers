"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApplyProgress } from "@/components/apply/apply-progress";
import { ApplyStepOne } from "@/components/apply/apply-step-one";
import { ApplyStepThree } from "@/components/apply/apply-step-three";
import { ApplyStepTwo } from "@/components/apply/apply-step-two";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplyBranch, ApplyOrganization, ApplyProfession } from "@/lib/organization/apply-context";
import { hasMultipleBranches } from "@/lib/organization/apply-context";
import {
  APPLICATION_STEP_FIELDS,
  type ApplicationFormValues,
  createApplicationSchema,
} from "@/lib/validation/application";

interface ApplicationFormProps {
  organization: ApplyOrganization;
  branchSlug: string | null;
  branches: ApplyBranch[];
  professions: ApplyProfession[];
}

type Step = 1 | 2 | 3;

/**
 * Owns the shared form/step state for both breakpoints — one implementation,
 * responsive via Tailwind (per feature 08 §3), rather than separate mobile
 * and desktop forms. Mobile gets ApplyProgress's dot indicator, desktop gets
 * its numbered stepper; the fields, validation, and step gating are
 * identical either way.
 */
export function ApplicationForm({
  organization,
  branchSlug,
  branches,
  professions,
}: ApplicationFormProps) {
  const t = useTranslations("ApplyPage");
  const tForm = useTranslations("ApplyPage.form");
  const branchRequired = hasMultipleBranches(branches);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(createApplicationSchema(tForm, { branchRequired })),
    defaultValues: {
      organizationProfessionId: undefined,
      internshipType: undefined,
      scope: undefined,
      branchId: undefined,
      exactDateUnknown: false,
      requestedStartDate: null,
      requestedEndDate: null,
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      email: "",
      phone: "",
    },
  });

  const [step, setStep] = useState<Step>(1);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);

  async function goNext() {
    if (step === 3) return;

    const valid = await form.trigger(APPLICATION_STEP_FIELDS[step]);
    if (!valid) return;

    if (step === 2) {
      if (!consentChecked) {
        setConsentError(true);
        return;
      }
      setConsentError(false);
    }

    setStep((prev) => (prev + 1) as Step);
  }

  function goBack() {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  }

  const stepLabels = [t("steps.1"), t("steps.2"), t("steps.3")] as const;

  return (
    <Card className="rounded-md">
      <CardContent className="p-6">
        <p className="text-sm font-semibold tracking-wide text-foreground uppercase">
          {organization.name}
        </p>

        <div className="mt-4">
          <ApplyProgress step={step} labels={stepLabels} />
        </div>

        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold">{stepLabels[step - 1]}</h1>
          <p className="text-sm text-muted-foreground">
            {t("stepLabel", { current: step, total: 3 })} — {t(`stepDescriptions.${step}`)}
          </p>
        </div>

        {step === 1 && <ApplyStepOne form={form} professions={professions} branches={branches} />}
        {step === 2 && (
          <ApplyStepTwo
            form={form}
            consentChecked={consentChecked}
            onConsentChange={(checked) => {
              setConsentChecked(checked);
              if (checked) setConsentError(false);
            }}
            consentError={consentError}
          />
        )}
        {step === 3 && (
          <ApplyStepThree
            form={form}
            professions={professions}
            branches={branches}
            orgSlug={organization.slug}
            urlBranchSlug={branchSlug}
            onBack={goBack}
          />
        )}

        {step !== 3 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={goBack}>
                {t("back")}
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" onClick={() => void goNext()}>
              {t("continue")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
