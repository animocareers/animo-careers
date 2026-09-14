"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";

import { signOut } from "@/app/[locale]/dashboard/actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  email: string;
}

/** Avatar button in the navbar that opens the account menu (profile, settings, sign out). */
export function UserMenu({ email }: UserMenuProps) {
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
      {isSigningOut && <LoadingOverlay label={t("signingOut")} />}
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("accountMenu")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initial}
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
