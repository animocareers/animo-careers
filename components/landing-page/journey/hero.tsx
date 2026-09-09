import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { FounderBio } from "@/components/landing-page/shared/founder-bio";

export async function Hero() {
  const t = await getTranslations("JourneyPage.hero");

  return (
    <section className="bg-mesh">
      <div className="container flex flex-col items-center gap-8 py-16 text-center md:py-24">
        <FounderBio initials="HG" />
        <h1 className="max-w-3xl text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t("subtitle")}
        </p>
        <Button
          size="lg"
          className="min-h-14 rounded-full bg-gradient-primary px-8 text-base shadow-button transition-transform hover:scale-105"
        >
          {t("cta")}
          <ArrowRight className="ml-2 size-5" />
        </Button>
      </div>
    </section>
  );
}
