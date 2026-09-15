import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { ApplicationForm } from "@/components/apply/application-form";
import { buildPageMetadata } from "@/lib/metadata";
import {
  listBranches,
  listOrganizationProfessions,
  resolveBranchBySlug,
  resolveOrganizationBySlug,
} from "@/lib/organization/apply-context";
import { createClient } from "@/lib/supabase/server";

/** Builds localized metadata for the public apply page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "ApplyPage");
}

/**
 * Public, unauthenticated apply page reached via an organization's apply
 * link (`/{locale}/application/apply/{orgSlug}` or `.../{orgSlug}/{branchSlug}`).
 * Resolves the organization (and optional branch) server-side, using the
 * anon client — see the anon-read RLS migration this depends on.
 */
export default async function ApplyPage({
  params,
}: PageProps<"/[locale]/application/apply/[orgSlug]/[[...branchSlug]]">) {
  const { locale, orgSlug, branchSlug: branchSlugSegments } = await params;
  setRequestLocale(locale);

  // The URL pattern is a single optional branch segment — anything longer
  // doesn't correspond to a real apply link.
  if (branchSlugSegments && branchSlugSegments.length > 1) {
    notFound();
  }
  const branchSlug = branchSlugSegments?.[0] ?? null;

  const supabase = await createClient();

  const organization = await resolveOrganizationBySlug(supabase, orgSlug);
  if (!organization) {
    notFound();
  }

  if (branchSlug) {
    const branch = await resolveBranchBySlug(supabase, organization.id, branchSlug);
    if (!branch) {
      notFound();
    }
  }

  const [branches, professions] = await Promise.all([
    listBranches(supabase, organization.id),
    listOrganizationProfessions(supabase, organization.id),
  ]);

  return (
    <div className="w-full max-w-md py-8 md:max-w-3xl">
      <ApplicationForm
        organization={organization}
        branchSlug={branchSlug}
        branches={branches}
        professions={professions}
      />
    </div>
  );
}
