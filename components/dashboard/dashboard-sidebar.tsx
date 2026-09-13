"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AnimoLogo } from "@/components/landing-page/shared/animo-logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { primaryNavItems, secondaryNavItems } from "./nav-items";

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
      <div className={cn("flex items-center p-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/dashboard">
            <AnimoLogo className="h-6 w-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        <DashboardNav items={primaryNavItems} collapsed={collapsed} />
        <div className="my-3 border-t border-sidebar-border" />
        <DashboardNav items={secondaryNavItems} collapsed={collapsed} />
      </div>
    </aside>
  );
}
