import {
  ClipboardList,
  Database,
  Handshake,
  Kanban,
  ListTodo,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  key: "pipeline" | "tasks" | "internshipPlan" | "schoolPartners" | "workflows" | "masterData";
  icon: LucideIcon;
  /** Omitted for nav items whose page doesn't exist yet – rendered as an inert placeholder. */
  href?: string;
}

/** Top nav group, mirroring the screenshot's primary section above the divider. */
export const primaryNavItems: DashboardNavItem[] = [
  { key: "pipeline", icon: Kanban, href: "/dashboard" },
  { key: "tasks", icon: ListTodo },
  { key: "internshipPlan", icon: ClipboardList },
];

/** Section below the divider, matching the screenshot's "Schulpartner" entry. */
export const partnerNavItems: DashboardNavItem[] = [{ key: "schoolPartners", icon: Handshake }];

/** Bottom-pinned group, matching the screenshot's "Workflows" / "Stammdaten" entries. */
export const secondaryNavItems: DashboardNavItem[] = [
  { key: "workflows", icon: Workflow },
  { key: "masterData", icon: Database },
];
