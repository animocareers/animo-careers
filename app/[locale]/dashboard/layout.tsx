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
  let organizationId: string | null = null;
  try {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", data.claims.sub)
      .maybeSingle();
    organizationId = membership?.organization_id ?? null;

    if (!organizationId) {
      const { data: joinedOrgId } = await supabase.rpc("join_organization_by_domain");
      organizationId = joinedOrgId ?? null;
    }
  } catch {
    // A transient network/auth hiccup here (e.g. racing a concurrent
    // sign-out) shouldn't crash the whole dashboard with a raw 500 — treat
    // it as "can't confirm the session right now" and send the user back
    // through login rather than risk rendering incorrect state.
    redirect(`/${locale}/auth/login`);
  }

  let mainContent = children;
  if (!organizationId) {
    let professions: { id: string; name_de: string }[] = [];
    try {
      const { data: professionsData } = await supabase
        .from("profession_catalog")
        .select("id, name_de")
        .order("name_de");
      professions = professionsData ?? [];
    } catch {
      // Non-fatal: the form just renders with no options to pick yet.
    }
    mainContent = <OrganizationSetupPrompt locale={locale} professions={professions} />;
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
