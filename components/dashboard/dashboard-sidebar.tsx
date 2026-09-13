"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { AnimoLogo } from "@/components/landing-page/shared/animo-logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { partnerNavItems, primaryNavItems, secondaryNavItems } from "./nav-items";

/** Persistent, collapsible sidebar for the dashboard shell (hidden below the `lg` breakpoint). */
export function DashboardSidebar() {
  const t = useTranslations("DashboardLayout");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-18" : "w-64"
      )}
    >
      <div className={cn("flex items-center p-4", collapsed && "justify-center px-2")}>
        <Link href="/dashboard">
          <AnimoLogo className="h-6 w-auto" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3">
        <DashboardNav items={primaryNavItems} collapsed={collapsed} />
        <div className="my-3 border-t border-sidebar-border" />
        <DashboardNav items={partnerNavItems} collapsed={collapsed} />
        <div className="flex-1" />
        <DashboardNav items={secondaryNavItems} collapsed={collapsed} />
      </div>

      <div className="flex items-center justify-between border-t border-sidebar-border p-3">
        <SignOutButton />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="w-full"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </aside>
  );
}
