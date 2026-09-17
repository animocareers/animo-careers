"use client";

import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { formatGermanDate, fromIsoDate } from "@/lib/date";
import type {
  ApplyBranch,
  ApplyProfession,
} from "@/lib/organization/apply-context";
import {
  buildApplyPayload,
  type ApplicationFormValues,
} from "@/lib/validation/application";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface ApplyStepThreeProps {
  form: UseFormReturn<ApplicationFormValues>;
  professions: ApplyProfession[];
  branches: ApplyBranch[];
  orgSlug: string;
  /** The branch segment from the URL, if the applicant arrived via a branch-specific apply link. */
  urlBranchSlug: string | null;
  onBack: () => void;
}

/** Step 3 — "Review & submit": read-only summary, then the real submission to /api/public-apply. */
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
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const values = form.watch();

  const profession = professions.find(
    (p) => p.organizationProfessionId === values.organizationProfessionId,
  );
  const branch = branches.find((b) => b.id === values.branchId);

  function formatDate(iso: string | null) {
    return iso ? formatGermanDate(fromIsoDate(iso)) : tReview("noDate");
  }

  async function handleSubmit() {
    if (status === "submitting") return; // double-submit guard, alongside the disabled button below

    // The applicant may have picked a branch via step 1's selector (org has
    // >1 branch and no branch was pre-selected by the URL) — that choice
    // must win over the URL's own branch segment, which is only populated
    // when they arrived via a branch-specific apply link to begin with.
    const effectiveBranchSlug = branch?.slug ?? urlBranchSlug;
    const payload = buildApplyPayload(values, {
      orgSlug,
      branchSlug: effectiveBranchSlug,
    });

    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/public-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setFormError(t("submitError"));
        setStatus("error");
        return;
      }

      const data: { emailSent?: boolean } = await response.json().catch(() => ({}));
      setEmailSent(data.emailSent !== false);
      setStatus("success");
    } catch {
      setFormError(t("submitError"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-2 py-6 text-center">
        <h2 className="text-xl font-semibold">{t("successTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(emailSent ? "successDescription" : "successDescriptionEmailFailed")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <dl className="divide-y rounded-2xl border">
        <ReviewRow
          label={tForm("professionLabel")}
          value={profession?.nameDe ?? "—"}
        />
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
        <ReviewRow
          label={tForm("dateOfBirthLabel")}
          value={formatDate(values.dateOfBirth)}
        />
        <ReviewRow label={tForm("emailLabel")} value={values.email} />
        <ReviewRow label={tForm("phoneLabel")} value={values.phone || "—"} />
      </dl>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={status === "submitting"}
        >
          {t("back")}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
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
