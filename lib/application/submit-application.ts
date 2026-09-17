import { z } from "zod";

import {
  type ApplyBranch,
  type ApplyOrganization,
  type ApplyProfession,
  listBranches,
  listOrganizationProfessions,
  resolveBranchBySlug,
  resolveOrganizationBySlug,
} from "@/lib/organization/apply-context";
import { sendApplicationConfirmationEmail } from "@/lib/email/send-confirmation-email";
import { createClient as createAnonClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { applyRequestSchema, createApplicationSchema } from "@/lib/validation/application";

/** Returns translation keys unchanged — this handler never renders these messages to the applicant (see route.ts), so localization doesn't apply here. */
const t = (key: string) => key;

export type SubmitPublicApplicationResult =
  | { status: "success"; applicationId: string; emailSent: boolean }
  | { status: "invalid"; fieldErrors: Record<string, string[] | undefined> }
  | { status: "not_found" }
  | { status: "server_error" };

interface SubmitApplicationRpcParams {
  p_organization_id: string;
  p_branch_id: string;
  p_organization_profession_id: string;
  p_first_name: string;
  p_last_name: string;
  p_email: string;
  p_phone: string;
  p_date_of_birth: string;
  p_scope: string;
  p_is_school_mandatory: boolean;
  p_requested_start_date: string | null;
  p_requested_end_date: string | null;
}

interface SubmitApplicationRpcResult {
  data: string | null;
  error: { message: string } | null;
}

/**
 * Every external effect this function needs, injectable for tests. Each
 * dependency is the narrowest possible shape (a plain async function), not a
 * Supabase client — so a test supplies a fixture value directly instead of
 * mocking Supabase's fluent query builder. Defaults are the real
 * implementations; the route handler calls submitPublicApplication(body)
 * with no extra wiring.
 */
export interface SubmitPublicApplicationDeps {
  resolveOrganization?: (slug: string) => Promise<ApplyOrganization | null>;
  resolveBranch?: (organizationId: string, slug: string) => Promise<ApplyBranch | null>;
  listOrgBranches?: (organizationId: string) => Promise<ApplyBranch[]>;
  listOrgProfessions?: (organizationId: string) => Promise<ApplyProfession[]>;
  submitApplicationRpc?: (params: SubmitApplicationRpcParams) => Promise<SubmitApplicationRpcResult>;
  sendConfirmationEmail?: typeof sendApplicationConfirmationEmail;
}

/** Runs an apply-context lookup against a freshly created anon client — see lib/supabase/server.ts on why the client itself is never cached across calls. */
async function withAnonClient<T>(
  fn: (supabase: Awaited<ReturnType<typeof createAnonClient>>) => Promise<T>,
): Promise<T> {
  const supabase = await createAnonClient();
  return fn(supabase);
}

async function defaultResolveOrganization(slug: string) {
  return withAnonClient((supabase) => resolveOrganizationBySlug(supabase, slug));
}

async function defaultResolveBranch(organizationId: string, slug: string) {
  return withAnonClient((supabase) => resolveBranchBySlug(supabase, organizationId, slug));
}

async function defaultListOrgBranches(organizationId: string) {
  return withAnonClient((supabase) => listBranches(supabase, organizationId));
}

async function defaultListOrgProfessions(organizationId: string) {
  return withAnonClient((supabase) => listOrganizationProfessions(supabase, organizationId));
}

async function defaultSubmitApplicationRpc(
  params: SubmitApplicationRpcParams,
): Promise<SubmitApplicationRpcResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("submit_public_application", params);
  return { data: (data as string | null) ?? null, error };
}

/**
 * Validates and persists a public application submission. Re-validates the
 * full payload server-side (never trusts the client's own Zod validation),
 * resolves the organization/branch/profession from the link the applicant
 * actually used (never trusts a client-supplied ID), and writes atomically
 * via the submit_public_application RPC (see the matching migration) —
 * bypassing RLS deliberately, since there's no anon-insert policy on
 * `applications`.
 *
 * Email failure never changes the result: a successful save is always
 * reported as success even if the confirmation email couldn't be sent.
 */
export async function submitPublicApplication(
  rawBody: unknown,
  deps: SubmitPublicApplicationDeps = {},
): Promise<SubmitPublicApplicationResult> {
  const resolveOrganization = deps.resolveOrganization ?? defaultResolveOrganization;
  const resolveBranch = deps.resolveBranch ?? defaultResolveBranch;
  const listOrgBranches = deps.listOrgBranches ?? defaultListOrgBranches;
  const listOrgProfessions = deps.listOrgProfessions ?? defaultListOrgProfessions;
  const submitApplicationRpc = deps.submitApplicationRpc ?? defaultSubmitApplicationRpc;
  const sendConfirmationEmail = deps.sendConfirmationEmail ?? sendApplicationConfirmationEmail;

  const contextParsed = applyRequestSchema.safeParse(rawBody);
  if (!contextParsed.success) {
    return { status: "invalid", fieldErrors: z.flattenError(contextParsed.error).fieldErrors };
  }
  const { orgSlug, branchSlug, isSchoolMandatory } = contextParsed.data;
  // Safe: applyRequestSchema is a z.object, so a successful parse guarantees
  // rawBody was a non-null object.
  const rawBodyObject = rawBody as Record<string, unknown>;

  const organization = await resolveOrganization(orgSlug);
  if (!organization) return { status: "not_found" };

  const branches = await listOrgBranches(organization.id);
  let branch: ApplyBranch | null = null;
  if (branchSlug) {
    branch = await resolveBranch(organization.id, branchSlug);
    if (!branch) return { status: "not_found" };
  } else if (branches.length === 1) {
    branch = branches[0];
  } else {
    // A multi-branch org with no resolvable branch slug is a genuine
    // ambiguity this handler can't safely guess through — see the feature's
    // known-gaps notes (branches.slug is nullable per the schema).
    return {
      status: "invalid",
      fieldErrors: { branchSlug: ["branch_could_not_be_resolved"] },
    };
  }

  // Adapts the wire payload to the client form's schema shape:
  //  - internshipType is derived from the now-validated isSchoolMandatory
  //  - exactDateUnknown is a UI-only toggle the schema requires but never
  //    reads in its refine logic — a placeholder has zero effect here
  //  - branchRequired is always false: this handler determines the branch
  //    via orgSlug/branchSlug resolution above, never via the client's
  //    branchId form field, which the wire payload doesn't even carry
  const applicantParsed = createApplicationSchema(t, { branchRequired: false }).safeParse({
    ...rawBodyObject,
    internshipType: isSchoolMandatory ? "obligatory" : "voluntary",
    exactDateUnknown: false,
  });
  if (!applicantParsed.success) {
    return { status: "invalid", fieldErrors: z.flattenError(applicantParsed.error).fieldErrors };
  }
  const applicant = applicantParsed.data;

  const professions = await listOrgProfessions(organization.id);
  const profession = professions.find(
    (p) => p.organizationProfessionId === applicant.organizationProfessionId,
  );
  if (!profession) {
    return {
      status: "invalid",
      fieldErrors: { organizationProfessionId: ["invalid_profession"] },
    };
  }

  const { data: applicationId, error } = await submitApplicationRpc({
    p_organization_id: organization.id,
    p_branch_id: branch.id,
    p_organization_profession_id: applicant.organizationProfessionId,
    p_first_name: applicant.firstName,
    p_last_name: applicant.lastName,
    p_email: applicant.email,
    p_phone: applicant.phone ?? "",
    p_date_of_birth: applicant.dateOfBirth,
    p_scope: applicant.scope,
    p_is_school_mandatory: isSchoolMandatory,
    p_requested_start_date: applicant.requestedStartDate,
    p_requested_end_date: applicant.requestedEndDate,
  });

  if (error || !applicationId) {
    console.error("[submitPublicApplication] rpc failed", {
      organizationId: organization.id,
      branchId: branch.id,
      message: error?.message,
    });
    return { status: "server_error" };
  }

  let emailSent = true;
  try {
    await sendConfirmationEmail({
      to: applicant.email,
      applicantFirstName: applicant.firstName,
      organizationName: organization.name,
      branchName: branch.name,
      professionName: profession.nameDe,
      requestedStartDate: applicant.requestedStartDate,
      requestedEndDate: applicant.requestedEndDate,
    });
  } catch (emailError) {
    // Deliberately swallowed: an email failure must never roll back the
    // save or fail the response to the applicant (feature 09 §6). The
    // caller still gets to know via emailSent, so the UI can tell the
    // applicant their confirmation email didn't go out.
    emailSent = false;
    console.error("[submitPublicApplication] confirmation email failed", {
      applicationId,
      organizationId: organization.id,
      error: emailError instanceof Error ? emailError.message : String(emailError),
    });
  }

  return { status: "success", applicationId, emailSent };
}
