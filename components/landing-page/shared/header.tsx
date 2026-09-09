import { LogIn, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Link } from "@/i18n/navigation";

import { AnimoLogo } from "./animo-logo";
import { MobileNav } from "./mobile-nav";

const navLinks = [
  { href: "/schueler", key: "schueler" },
  { href: "/unternehmen", key: "unternehmen" },
  { href: "/schulen", key: "schulen" },
  { href: "/partner", key: "partner" },
] as const;

export async function Header() {
  const t = await getTranslations("Nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center text-2xl transition-opacity hover:opacity-80">
          <AnimoLogo className="h-8" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              nativeButton={false}
              className="rounded-full"
              render={<Link href={link.href}>{t(link.key)}</Link>}
            />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            nativeButton={false}
            className="rounded-full"
            render={
              <Link href="/login">
                <LogIn />
                {t("login")}
              </Link>
            }
          />
          <Button
            nativeButton={false}
            className="rounded-full bg-gradient-primary shadow-button"
            render={
              <Link href="/register">
                <UserPlus />
                {t("register")}
              </Link>
            }
          />
          <div className="ml-2 flex items-center gap-1">
            <LocaleSwitcher />
            <ModeToggle />
          </div>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LocaleSwitcher />
          <ModeToggle />
          <MobileNav
            navLinks={navLinks.map((link) => ({ href: link.href, label: t(link.key) }))}
            loginLabel={t("login")}
            registerLabel={t("register")}
            menuLabel={t("menuLabel")}
          />
        </div>
      </div>
    </header>
  );
}
