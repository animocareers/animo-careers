import { ArrowRight, Building2, GraduationCap, Handshake, School } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const personas = [
  {
    key: "student",
    href: "/schueler",
    icon: GraduationCap,
    gradient: "bg-gradient-student",
    fg: "text-student-foreground",
    span: "md:col-span-4 md:row-span-2",
    iconSize: "size-14",
    title: "text-3xl md:text-4xl",
  },
  {
    key: "company",
    href: "/unternehmen",
    icon: Building2,
    gradient: "bg-gradient-company",
    fg: "text-company-foreground",
    span: "md:col-span-2",
    iconSize: "size-10",
    title: "text-2xl",
  },
  {
    key: "partner",
    href: "/partner",
    icon: Handshake,
    gradient: "bg-gradient-partner",
    fg: "text-partner-foreground",
    span: "md:col-span-2",
    iconSize: "size-10",
    title: "text-2xl",
  },
  {
    key: "school",
    href: "/schulen",
    icon: School,
    gradient: "bg-gradient-school",
    fg: "text-school-foreground",
    span: "md:col-span-6",
    iconSize: "size-8",
    title: "text-2xl md:text-3xl",
    badgeKey: "schoolBadge",
  },
] as const;

export async function AudienceBentoGrid() {
  const t = await getTranslations("HomePage.bento");

  return (
    <section className="container pb-20">
      <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
        {personas.map((persona) => {
          const Icon = persona.icon;
          return (
            <Link
              key={persona.key}
              href={persona.href}
              className={cn(
                "group relative overflow-hidden rounded-3xl p-8 shadow-card transition-all hover:shadow-glow md:p-10",
                persona.gradient,
                persona.fg,
                persona.span
              )}
            >
              <div className="absolute -top-12 -right-12 size-56 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
              <div className="relative flex h-full flex-col">
                {"badgeKey" in persona && persona.badgeKey && (
                  <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    {t(persona.badgeKey)}
                  </span>
                )}
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Icon className={persona.iconSize} />
                </div>
                <h2 className={cn("mb-2 font-bold", persona.title)}>
                  {t(`${persona.key}.title`)}
                </h2>
                <p className="max-w-md text-base leading-relaxed text-white/90 md:text-lg">
                  {t(`${persona.key}.description`)}
                </p>
                <div className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold">
                  {t(`${persona.key}.cta`)}
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
