import { z } from "zod";

export interface ApplicationSchemaOptions {
  /** True when the organization has more than one branch — the branch selector then becomes mandatory. */
  branchRequired: boolean;
}

/**
 * Creates the localized validation schema for the public application form.
 * One shared schema drives both mobile and desktop (same steps, same
 * fields) and is intended to be reused as-is by the future
 * /api/public-apply Route Handler (see api-design.md) once the applications
 * table's write path exists — `branchRequired` is the one piece of context
 * (whether the org has >1 branch) that schema can't know on its own.
 */
export function createApplicationSchema(
  t: (key: string) => string,
  options: ApplicationSchemaOptions,
) {
  return z
    .object({
      organizationProfessionId: z.uuid({ error: t("professionRequired") }),
      internshipType: z.enum(["obligatory", "voluntary"], {
        error: t("internshipTypeRequired"),
      }),
      scope: z.enum(["single_profession", "orientierungspraktikum"], {
        error: t("scopeRequired"),
      }),
      branchId: z.uuid({ error: t("branchInvalid") }).optional(),
      exactDateUnknown: z.boolean(),
      requestedStartDate: z.iso.date({ error: t("invalidDate") }).nullable(),
      requestedEndDate: z.iso.date({ error: t("invalidDate") }).nullable(),
      firstName: z.string().trim().min(1, { error: t("firstNameRequired") }),
      lastName: z.string().trim().min(1, { error: t("lastNameRequired") }),
      dateOfBirth: z.iso.date({ error: t("dateOfBirthRequired") }),
      email: z.email({ error: t("invalidEmail") }).trim(),
      phone: z.string().trim().optional(),
    })
    .refine((data) => !options.branchRequired || !!data.branchId, {
      path: ["branchId"],
      error: t("branchRequired"),
    })
    .refine(
      (data) =>
        !data.requestedStartDate ||
        !data.requestedEndDate ||
        data.requestedStartDate <= data.requestedEndDate,
      {
        path: ["requestedEndDate"],
        error: t("endDateBeforeStart"),
      },
    );
}

export type ApplicationFormValues = z.infer<ReturnType<typeof createApplicationSchema>>;

/** Which fields each wizard step collects, used to gate that step's Continue button via RHF's `trigger(...)`. */
export const APPLICATION_STEP_FIELDS = {
  1: [
    "organizationProfessionId",
    "internshipType",
    "scope",
    "branchId",
    "requestedStartDate",
    "requestedEndDate",
    "exactDateUnknown",
  ],
  2: ["firstName", "lastName", "dateOfBirth", "email", "phone"],
} as const satisfies Record<1 | 2, (keyof ApplicationFormValues)[]>;

export interface ApplyPayloadContext {
  orgSlug: string;
  branchSlug: string | null;
}

/**
 * Validates the parts of POST /api/public-apply's wire payload that aren't
 * covered by createApplicationSchema: orgSlug/branchSlug identify the link
 * the applicant used (resolved to real IDs server-side, never trusted as
 * IDs directly), and isSchoolMandatory is buildApplyPayload's collapsed
 * form of the form's internshipType field. See lib/application/submit-application.ts
 * for how this pairs with createApplicationSchema to validate the full body.
 */
export const applyRequestSchema = z.object({
  orgSlug: z.string().trim().min(1),
  branchSlug: z.string().trim().min(1).nullable(),
  isSchoolMandatory: z.boolean(),
});

export type ApplyRequest = z.infer<typeof applyRequestSchema>;

/**
 * Assembles the future /api/public-apply request body (per api-design.md,
 * minus turnstileToken) from the form's current values — pure, so the
 * step-3 submit stub's payload-shaping logic is unit-testable without
 * rendering a form. `internshipType` only exists as a form-friendly string
 * for the RadioGroup; it's collapsed to the API's boolean here, in the one
 * place that shape actually matters.
 */
export function buildApplyPayload(values: ApplicationFormValues, context: ApplyPayloadContext) {
  return {
    orgSlug: context.orgSlug,
    branchSlug: context.branchSlug,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone ?? "",
    dateOfBirth: values.dateOfBirth,
    organizationProfessionId: values.organizationProfessionId,
    scope: values.scope,
    isSchoolMandatory: values.internshipType === "obligatory",
    requestedStartDate: values.exactDateUnknown ? null : values.requestedStartDate,
    requestedEndDate: values.exactDateUnknown ? null : values.requestedEndDate,
  };
}
