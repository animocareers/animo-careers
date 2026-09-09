import { ArrowRight, School } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EyebrowBadge } from "@/components/landing-page/shared/eyebrow-badge";

export async function Hero() {
  const t = await getTranslations("SchulenPage.hero");

  return (
    <section className="bg-mesh">
      <div className="container py-16 text-center md:py-24">
        <EyebrowBadge icon={School} className="mx-auto mb-6">
          {t("eyebrow")}
        </EyebrowBadge>
        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t("subtitle")}
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="min-h-14 rounded-full bg-gradient-school px-8 text-base shadow-button transition-transform hover:scale-105"
          >
            {t("cta")}
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
