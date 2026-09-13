"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { DashboardNavItem } from "./nav-items";

interface DashboardNavProps {
  items: DashboardNavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** One nav group for the dashboard sidebar, shared between the desktop sidebar and the mobile sheet. */
export function DashboardNav({ items, collapsed = false, onNavigate }: DashboardNavProps) {
  const t = useTranslations("DashboardLayout");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ key, icon: Icon, href }) => {
        const label = t(`nav.${key}`);

        if (!href) {
          return (
            <div
              key={key}
              title={`${label} · ${t("comingSoon")}`}
              className={cn(
                "flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2 text-sm text-sidebar-foreground/40",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </div>
          );
        }

        const isActive = pathname === href;

        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
