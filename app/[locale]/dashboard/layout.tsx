import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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

  return (
    <div className="flex min-h-svh">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardNavbar email={data.claims.email ?? ""} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
