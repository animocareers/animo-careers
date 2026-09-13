"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { AnimoLogo } from "@/components/landing-page/shared/animo-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

import { primaryNavItems, secondaryNavItems } from "./nav-items";

interface DashboardNavbarProps {
  email: string;
}

/** Top navbar for the dashboard shell: mobile nav trigger on the left, account controls on the right. */
export function DashboardNavbar({ email }: DashboardNavbarProps) {
  const t = useTranslations("DashboardLayout");
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center gap-2 border-b border-border bg-background p-4">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" aria-label={t("openMenu")}>
                <Menu />
              </Button>
            }
          />
          <SheetContent side="left" className="flex flex-col p-0">
            <SheetHeader className="border-b border-sidebar-border">
              <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <AnimoLogo className="h-6 w-auto" />
              </Link>
            </SheetHeader>

            <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
              <DashboardNav items={primaryNavItems} onNavigate={() => setOpen(false)} />
              <div className="my-3 border-t border-sidebar-border" />
              <DashboardNav items={secondaryNavItems} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard">
          <AnimoLogo className="h-6 w-auto" />
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ModeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
