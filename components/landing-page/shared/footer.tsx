import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { AnimoLogo } from "./animo-logo";

const audienceLinks = [
  { href: "/schueler", key: "schueler" },
  { href: "/unternehmen", key: "unternehmen" },
  { href: "/schulen", key: "schulen" },
  { href: "/partner", key: "partner" },
] as const;

const animoLinks = [
  { href: "/ueber-uns", key: "ueberUns" },
  { href: "/journey", key: "journey" },
] as const;

const legalLinks = [
  { href: "/impressum", key: "impressum" },
  { href: "/datenschutz", key: "datenschutz" },
  { href: "/agb", key: "agb" },
  { href: "/widerrufsbelehrung", key: "widerrufsbelehrung" },
] as const;

export async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");

  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center text-2xl">
            <AnimoLogo className="h-7" />
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {t("tagline")}
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">{t("forWhomHeading")}</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {audienceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {tNav(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">animo</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {animoLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">{t("legalHeading")}</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t py-6">
        <p className="container text-center text-sm text-muted-foreground">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
