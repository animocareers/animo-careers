"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";

interface MobileNavProps {
  navLinks: { href: string; label: string }[];
  loginLabel: string;
  registerLabel: string;
  menuLabel: string;
}

export function MobileNav({
  navLinks,
  loginLabel,
  registerLabel,
  menuLabel,
}: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={menuLabel}>
            <Menu />
          </Button>
        }
      />
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{menuLabel}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-6">
          {navLinks.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <Link
                  href={link.href}
                  className="rounded-2xl px-3 py-2.5 text-base font-medium hover:bg-muted"
                >
                  {link.label}
                </Link>
              }
            />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-6">
          <SheetClose
            nativeButton={false}
            render={
              <Button
                variant="outline"
                nativeButton={false}
                className="rounded-full"
                render={<Link href="/login">{loginLabel}</Link>}
              />
            }
          />
          <SheetClose
            nativeButton={false}
            render={
              <Button
                nativeButton={false}
                className="rounded-full bg-gradient-primary shadow-button"
                render={<Link href="/register">{registerLabel}</Link>}
              />
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
