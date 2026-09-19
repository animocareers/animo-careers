import { UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InviteMemberButtonProps {
  label: string;
}

/**
 * Visual-only per feature 10 — no invite drawer, email, or `invitations` row
 * creation wired up here; that's a separate, later feature. No click handler
 * on purpose.
 */
export function InviteMemberButton({ label }: InviteMemberButtonProps) {
  return (
    <Button type="button" variant="outline">
      <UserPlusIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
