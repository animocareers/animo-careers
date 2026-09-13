import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";

/** Builds localized metadata for the dashboard page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "DashboardPage");
}

/** Renders the dashboard for authenticated users and redirects guests. */
export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect(`/${locale}/auth/login`);
  }

  const t = await getTranslations("DashboardPage");

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-muted-foreground">{t("placeholder")}</p>
    </div>
  );
}
