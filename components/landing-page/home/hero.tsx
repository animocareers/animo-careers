import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EyebrowBadge } from "@/components/landing-page/shared/eyebrow-badge";

export async function Hero() {
  const t = await getTranslations("HomePage.hero");

  return (
    <section className="relative overflow-hidden bg-mesh">
      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6 text-center">
          <EyebrowBadge icon={Sparkles}>{t("eyebrow")}</EyebrowBadge>
          <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl lg:text-7xl">
            {t("titleLine1")}
            <br />
            <span className="text-gradient">{t("titleLine2")}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t("subtitle")}
          </p>
          <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              className="min-h-14 rounded-full bg-gradient-primary px-8 text-base shadow-button transition-transform hover:scale-105"
              render={
                <Link href="/schueler">
                  {t("ctaStudent")}
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              }
            />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              className="min-h-14 rounded-full px-8 text-base"
              render={<Link href="/schulen">{t("ctaTeacher")}</Link>}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
