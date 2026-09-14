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
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect(`/${locale}/auth/login`);
  }

  // A first-time signup has no organization yet. Auto-join one if the
  // caller's email domain matches an existing org; otherwise show the
  // onboarding form in place of the normal dashboard content until they
  // create one. See context/features/feature 06.md.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", data.claims.sub)
    .maybeSingle();

  let organizationId: string | null = membership?.organization_id ?? null;
  if (!organizationId) {
    const { data: joinedOrgId } = await supabase.rpc("join_organization_by_domain");
    organizationId = joinedOrgId ?? null;
  }

  let mainContent = children;
  if (!organizationId) {
    const { data: professions } = await supabase
      .from("profession_catalog")
      .select("id, name_de")
      .order("name_de");
    mainContent = <OrganizationSetupPrompt locale={locale} professions={professions ?? []} />;
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
