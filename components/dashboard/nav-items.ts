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

/** Top nav group, above the separator. */
export const primaryNavItems: DashboardNavItem[] = [
  { key: "pipeline", icon: Kanban, href: "/dashboard" },
  { key: "tasks", icon: ListTodo },
  { key: "internshipPlan", icon: ClipboardList },
];

/** Nav group below the separator. */
export const secondaryNavItems: DashboardNavItem[] = [
  { key: "schoolPartners", icon: Handshake },
  { key: "workflows", icon: Workflow },
  { key: "masterData", icon: Database },
];
