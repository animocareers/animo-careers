"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validation/organization";

/** Ends the current Supabase session and returns the user to the login page. */
export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/auth/login`);
}

export type CreateOrganizationState = { status: "success" } | { status: "error"; message: string };

/** Validates organization details and creates it (with its owner, default branch and professions). */
export async function createOrganization(
  locale: string,
  values: unknown,
): Promise<CreateOrganizationState> {
  const t = await getTranslations({ locale, namespace: "OrganizationOnboarding.form" });
  const parsed = createOrganizationSchema(t).safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: t("submitFailed") };
  }

  const { name, street, postalCode, city, country, industryType, professionIds } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization_with_owner", {
    p_name: name,
    p_address: { street, postalCode, city, country },
    p_industry_type: industryType,
    p_profession_ids: professionIds,
  });

  if (error) {
    // These match the `raise exception` messages in create_organization_with_owner
    // (supabase/migrations/20260914070955_organization_onboarding.sql) — keep both in sync.
    if (error.message === "already_member") {
      // A membership can already exist if this ran twice concurrently (e.g.
      // a double form submit) — that's not a real failure, the caller just
      // needs to refresh to see it.
      return { status: "success" };
    }
    if (error.message === "invalid_profession_count") {
      return { status: "error", message: t("professionsMax") };
    }
    return { status: "error", message: t("submitFailed") };
  }

  // dashboard/layout.tsx decides what to render (the onboarding prompt vs.
  // real dashboard content) based on organization membership, and that
  // decision is cached per the App Router's layout caching — without this,
  // the caller's post-success navigation to /dashboard/settings/organization
  // can reuse the stale cached layout render (still showing the onboarding
  // sheet) instead of re-checking membership and finding the new org.
  revalidatePath("/[locale]/dashboard", "layout");
  return { status: "success" };
}
