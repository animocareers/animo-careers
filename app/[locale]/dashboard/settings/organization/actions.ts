"use server";

import { getTranslations } from "next-intl/server";

import { canManageOrganization, getOrganizationMembership } from "@/lib/organization/roles";
import { createClient } from "@/lib/supabase/server";
import { updateOrganizationSchema } from "@/lib/validation/organization";

export type UpdateOrganizationState = { status: "success" } | { status: "error"; message: string };

/** Validates and persists edits to the caller's organization (name, address, industry type). */
export async function updateOrganization(
  locale: string,
  values: unknown,
): Promise<UpdateOrganizationState> {
  const t = await getTranslations({ locale, namespace: "OrganizationOnboarding.form" });
  const parsed = updateOrganizationSchema(t).safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: t("submitFailed") };
  }

  const { name, street, postalCode, city, country, industryType } = parsed.data;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return { status: "error", message: t("submitFailed") };
  }

  const membership = await getOrganizationMembership(supabase, claimsData.claims.sub);

  // Re-checked here even though the settings page already gates access on
  // role: Server Actions are directly callable, independent of which page
  // rendered the form that triggered them. RLS is the real backstop — this
  // just returns a clean error instead of a silent no-op update.
  if (!membership || !canManageOrganization(membership.role)) {
    return { status: "error", message: t("submitFailed") };
  }

  const { data: updated, error } = await supabase
    .from("organizations")
    .update({
      name,
      address: { street, postalCode, city, country },
      industry_type: industryType,
    })
    .eq("id", membership.organizationId)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { status: "error", message: t("submitFailed") };
  }

  return { status: "success" };
}
