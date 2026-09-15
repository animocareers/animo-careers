"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatGermanDate, fromIsoDate } from "@/lib/date";
import type { ApplyBranch, ApplyProfession } from "@/lib/organization/apply-context";
import { buildApplyPayload, type ApplicationFormValues } from "@/lib/validation/application";

interface ApplyStepThreeProps {
  form: UseFormReturn<ApplicationFormValues>;
  professions: ApplyProfession[];
  branches: ApplyBranch[];
  orgSlug: string;
  /** The branch segment from the URL, if the applicant arrived via a branch-specific apply link. */
  urlBranchSlug: string | null;
  onBack: () => void;
}

/**
 * Step 3 — "Review & submit": read-only summary + a stubbed final submit.
 * Per feature 08 §7, this must NOT call any API or write to `applications` —
 * the table's schema isn't finalized yet. It only assembles and logs the
 * payload the future /api/public-apply route will expect.
 */
export function ApplyStepThree({
  form,
  professions,
  branches,
  orgSlug,
  urlBranchSlug,
  onBack,
}: ApplyStepThreeProps) {
  const t = useTranslations("ApplyPage");
  const tForm = useTranslations("ApplyPage.form");
  const tReview = useTranslations("ApplyPage.review");
  const [submitted, setSubmitted] = useState(false);
  const values = form.watch();

  const profession = professions.find(
    (p) => p.organizationProfessionId === values.organizationProfessionId,
  );
  const branch = branches.find((b) => b.id === values.branchId);

  function formatDate(iso: string | null) {
    return iso ? formatGermanDate(fromIsoDate(iso)) : tReview("noDate");
  }

  function handleSubmit() {
    // The applicant may have picked a branch via step 1's selector (org has
    // >1 branch and no branch was pre-selected by the URL) — that choice
    // must win over the URL's own branch segment, which is only populated
    // when they arrived via a branch-specific apply link to begin with.
    const effectiveBranchSlug = branch?.slug ?? urlBranchSlug;
    const payload = buildApplyPayload(values, { orgSlug, branchSlug: effectiveBranchSlug });
    // TODO: wire up once applications table schema is finalized — this is a
    // UI-only stub per feature 08 §7; it must not call /api/public-apply or
    // write to the applications table.
    console.log("Apply form submission (stub, not persisted):", payload);
    toast.success(t("successTitle"));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-2 py-6 text-center">
        <h2 className="text-xl font-semibold">{t("successTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("successDescription", { firstName: values.firstName })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <dl className="divide-y rounded-2xl border">
        <ReviewRow label={tForm("professionLabel")} value={profession?.nameDe ?? "—"} />
        {branches.length > 1 && (
          <ReviewRow label={tForm("branchLabel")} value={branch?.name ?? "—"} />
        )}
        <ReviewRow
          label={tForm("internshipTypeLabel")}
          value={
            values.internshipType === "obligatory"
              ? tForm("internshipTypeObligatory")
              : tForm("internshipTypeVoluntary")
          }
        />
        <ReviewRow
          label={tForm("scopeLabel")}
          value={
            values.scope === "single_profession"
              ? tForm("scopeSingleProfession")
              : tForm("scopeOrientierungspraktikum")
          }
        />
        <ReviewRow
          label={tForm("datesLabel")}
          value={
            values.exactDateUnknown
              ? tForm("exactDateUnknownLabel")
              : `${formatDate(values.requestedStartDate)} – ${formatDate(values.requestedEndDate)}`
          }
        />
        <ReviewRow label={tForm("firstNameLabel")} value={values.firstName} />
        <ReviewRow label={tForm("lastNameLabel")} value={values.lastName} />
        <ReviewRow label={tForm("dateOfBirthLabel")} value={formatDate(values.dateOfBirth)} />
        <ReviewRow label={tForm("emailLabel")} value={values.email} />
        <ReviewRow label={tForm("phoneLabel")} value={values.phone || "—"} />
      </dl>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          {t("back")}
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
