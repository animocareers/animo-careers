import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { buildPageMetadata } from "@/lib/metadata";

/** Builds localized metadata for the login page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "LoginPage");
}

/** Renders the localized login page and any confirmation failure state. */
export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/login">) {
  const { locale } = await params;
  const { error, confirmed } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("LoginPage");

  return (
    <AuthShell heading={t("heading")} subheading={t("subheading")}>
      <LoginForm
        locale={locale}
        confirmationFailed={error === "confirmation_failed"}
        emailConfirmed={confirmed === "1"}
      />
    </AuthShell>
  );
}
