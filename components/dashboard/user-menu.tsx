"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2Icon, Loader2Icon, LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";

import { signOut } from "@/app/[locale]/dashboard/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { canManageOrganization, type OrgRole } from "@/lib/organization/roles";

interface UserMenuProps {
  email: string;
  role: OrgRole | null;
}

/** Avatar button in the navbar that opens the account menu (profile, settings, sign out). */
export function UserMenu({ email, role }: UserMenuProps) {
  const t = useTranslations("DashboardLayout");
  const locale = useLocale();
  const initial = (email || "?").charAt(0).toUpperCase();
  const [isSigningOut, setIsSigningOut] = useState(false);

  /** Signs the user out; on an unexpected failure (rather than the normal redirect), re-enables the menu. */
  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(locale);
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("accountMenu")}
            disabled={isSigningOut}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isSigningOut ? (
              <Loader2Icon className="size-4 animate-spin" aria-label={t("signingOut")} />
            ) : (
              initial
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserRound />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings />
          {t("settings")}
        </DropdownMenuItem>
        {canManageOrganization(role) && (
          <DropdownMenuItem render={<Link href="/dashboard/settings/organization" />}>
            <Building2Icon />
            {t("organization")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => {
            void handleSignOut();
          }}
        >
          <LogOut />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
