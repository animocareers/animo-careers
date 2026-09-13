import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { buildPageMetadata } from "@/lib/metadata";

/** Builds localized metadata for the registration page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "SignupPage");
}

/** Renders the localized account registration page. */
export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/auth/register">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("SignupPage");

  return (
    <AuthShell heading={t("heading")} subheading={t("subheading")}>
      <SignupForm locale={locale} />
    </AuthShell>
  );
}
