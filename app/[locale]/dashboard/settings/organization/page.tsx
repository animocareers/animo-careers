import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { OrganizationSettingsForm } from "@/components/dashboard/organization-settings/organization-settings-form";
import { buildPageMetadata } from "@/lib/metadata";
import { buildApplyLink, resolveOrigin } from "@/lib/organization/apply-link";
import { canManageOrganization, getOrganizationMembership } from "@/lib/organization/roles";
import { createClient } from "@/lib/supabase/server";

/** Builds localized metadata for the organization settings page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "OrganizationSettings");
}

/** Server-rendered organization settings page: view/edit org details, copy the public apply link. Owner/admin only. */
export default async function OrganizationSettingsPage({
  params,
}: PageProps<"/[locale]/dashboard/settings/organization">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    redirect(`/${locale}/auth/login`);
  }

  const membership = await getOrganizationMembership(supabase, claimsData.claims.sub);

  // Page-level enforcement per feature 07: a non-owner/admin (or a user with
  // no organization yet) should never reach a working, editable version of
  // this page by URL alone. The RLS UPDATE policy on `organizations` is the
  // real backstop; this just avoids rendering a broken/empty edit form.
  if (!membership || !canManageOrganization(membership.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug, address, industry_type")
    .eq("id", membership.organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    redirect(`/${locale}/dashboard`);
  }

  const applyLink = buildApplyLink(resolveOrigin(await headers()), organization.slug);

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <OrganizationSettingsForm
        locale={locale}
        organization={organization}
        applyLink={applyLink}
      />
    </div>
  );
}
