import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { OrganizationSetupPrompt } from "@/components/dashboard/organization-onboarding/organization-setup-prompt";
import { createClient } from "@/lib/supabase/server";

/** Shared shell (sidebar + navbar) for every authenticated dashboard route. */
export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !data?.claims) {
    redirect(`/${locale}/auth/login`);
  }

  // A first-time signup has no organization yet. Auto-join one if the
  // caller's email domain matches an existing org; otherwise show the
  // onboarding form in place of the normal dashboard content until they
  // create one. See context/features/feature 06.md.
  let organizationId: string | null = null;
  let membershipLookupFailed = false;
  try {
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", data.claims.sub)
      .maybeSingle();
    if (membershipError) {
      membershipLookupFailed = true;
    } else {
      organizationId = membership?.organization_id ?? null;
    }

    if (!membershipLookupFailed && !organizationId) {
      const { data: joinedOrgId, error: joinError } = await supabase.rpc(
        "join_organization_by_domain",
      );
      if (joinError) {
        membershipLookupFailed = true;
      } else {
        organizationId = joinedOrgId ?? null;
      }
    }
  } catch {
    membershipLookupFailed = true;
  }

  if (membershipLookupFailed) {
    // A failed membership check means the dashboard cannot safely determine
    // the caller's tenant. Send them back through authentication instead of
    // treating the error as a first-time signup with no organization.
    redirect(`/${locale}/auth/login`);
  }

  let mainContent = children;
  if (!organizationId) {
    let professions: { id: string; name_de: string }[] = [];
    let professionCatalogError = false;
    try {
      const { data: professionsData, error: professionsError } = await supabase
        .from("profession_catalog")
        .select("id, name_de")
        .order("name_de");
      if (professionsError || !professionsData?.length) {
        professionCatalogError = true;
      } else {
        professions = professionsData;
      }
    } catch {
      professionCatalogError = true;
    }
    mainContent = (
      <OrganizationSetupPrompt
        locale={locale}
        professions={professions}
        professionCatalogError={professionCatalogError}
      />
    );
  }

  return (
    <div className="flex min-h-svh">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardNavbar email={data.claims.email ?? ""} />
        <main className="flex-1 overflow-y-auto">{mainContent}</main>
      </div>
    </div>
  );
}
