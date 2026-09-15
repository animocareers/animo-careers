import { setRequestLocale } from "next-intl/server";

import { AnimoLogo } from "@/components/landing-page/shared/animo-logo";
import { Link } from "@/i18n/navigation";

/**
 * Minimal, standalone shell for the public apply form — deliberately not
 * nested under app/[locale]/dashboard/, so it never inherits
 * DashboardLayout's sidebar/navbar or its auth redirect. This route is
 * reached by unauthenticated applicants via a company's own "Apply" button.
 */
export default async function ApplyLayout({
  children,
  params,
}: LayoutProps<"/[locale]/application/apply">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex justify-center py-6">
        <Link href="/" aria-label="animo">
          <AnimoLogo className="text-2xl" />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-12">{children}</main>
    </div>
  );
}
