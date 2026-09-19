"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { canManageOrganization, getOrganizationMembership } from "@/lib/organization/roles";
import { updateOrganizationMember as updateOrganizationMemberCore } from "@/lib/organization/update-member";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validation/organization";

export type UpdateOrganizationState = { status: "success" } | { status: "error"; message: string };

/** Validates and persists edits to the caller's organization (name, address, industry type, offered professions). */
export async function updateOrganization(
  locale: string,
  values: unknown,
): Promise<UpdateOrganizationState> {
  const t = await getTranslations({ locale, namespace: "OrganizationOnboarding.form" });
  const parsed = createOrganizationSchema(t).safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: t("submitFailed") };
  }

  const { name, street, postalCode, city, country, industryType, professionIds } = parsed.data;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return { status: "error", message: t("submitFailed") };
  }

  const membership = await getOrganizationMembership(supabase, claimsData.claims.sub);

  // Re-checked here even though the settings page already gates access on
  // role: Server Actions are directly callable, independent of which page
  // rendered the form that triggered them. The RPC re-checks this too (it's
  // the real backstop, since it does the actual writes) — this just avoids
  // a round trip for a request that's obviously not going to work.
  if (!membership || !canManageOrganization(membership.role)) {
    return { status: "error", message: t("submitFailed") };
  }

  const { error } = await supabase.rpc("update_organization_details", {
    p_organization_id: membership.organizationId,
    p_name: name,
    p_address: { street, postalCode, city, country },
    p_industry_type: industryType,
    p_profession_ids: professionIds,
  });

  if (error) {
    // These match the `raise exception` messages in
    // update_organization_details (supabase/migrations/20260915100000_update_organization_details.sql)
    // — keep both in sync.
    if (error.message === "invalid_profession_count") {
      return { status: "error", message: t("professionsMax") };
    }
    return { status: "error", message: t("submitFailed") };
  }

  return { status: "success" };
}

export type UpdateOrganizationMemberState =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Validates and persists a role/department edit from the Team Members detail
 * panel. Thin wrapper around lib/organization/update-member.ts's testable
 * core (which defaults to the real Supabase-backed implementation on its
 * own): this function just maps the result to translated messages and
 * revalidates the page, the same split submit-application.ts / route.ts uses
 * for the public-apply path.
 */
export async function updateOrganizationMember(
  locale: string,
  memberId: string,
  values: unknown,
): Promise<UpdateOrganizationMemberState> {
  const t = await getTranslations({ locale, namespace: "OrganizationSettings.teamMembers.panel" });

  const result = await updateOrganizationMemberCore(memberId, values);

  if (result.status === "success") {
    revalidatePath(`/${locale}/dashboard/settings/organization`);
    return { status: "success" };
  }

  if (result.status === "forbidden") {
    return { status: "error", message: t("forbidden") };
  }

  return { status: "error", message: t("saveFailed") };
}
