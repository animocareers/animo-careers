import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPageMetadata } from "@/lib/metadata";

/** Builds localized metadata for the dashboard page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "DashboardPage");
}

/** Renders the dashboard for authenticated users; auth is enforced by the layout. */
export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("DashboardPage");

  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-muted-foreground">{t("placeholder")}</p>
    </div>
  );
}
