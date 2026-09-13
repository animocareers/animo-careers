"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { AnimoLogo } from "@/components/landing-page/shared/animo-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

import { partnerNavItems, primaryNavItems, secondaryNavItems } from "./nav-items";

/** Mobile-only top bar that opens the dashboard nav in a slide-over sheet. */
export function DashboardMobileNav() {
  const t = useTranslations("DashboardLayout");
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar p-4 lg:hidden">
      <Link href="/dashboard">
        <AnimoLogo className="h-6 w-auto" />
      </Link>

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
            <DashboardNav items={partnerNavItems} onNavigate={() => setOpen(false)} />
            <div className="flex-1" />
            <DashboardNav items={secondaryNavItems} onNavigate={() => setOpen(false)} />
          </div>

          <div className="flex items-center justify-between border-t border-sidebar-border p-3">
            <SignOutButton />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
