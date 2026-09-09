import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EyebrowBadge } from "@/components/landing-page/shared/eyebrow-badge";
import { Link } from "@/i18n/navigation";

const chipKeys = ["questions", "analysis", "email"] as const;
const emojis = ["📝", "🤖", "📧"];

export async function AssessmentIntro() {
  const t = await getTranslations("AssessmentPage");

  return (
    <section className="bg-mesh">
      <div className="container py-16 text-center md:py-24">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("backLink")}
        </Link>

        <EyebrowBadge icon={Sparkles} className="mx-auto mb-6">
          {t("eyebrow")}
        </EyebrowBadge>

        <h1 className="mx-auto max-w-2xl text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t("subtitle")}
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
          {chipKeys.map((key, i) => (
            <div
              key={key}
              className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-6"
            >
              <span className="text-3xl">{emojis[i]}</span>
              <p className="font-semibold">{t(`chips.${key}.title`)}</p>
              <p className="text-sm text-muted-foreground">
                {t(`chips.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Button
            size="lg"
            className="min-h-14 rounded-full bg-gradient-primary px-8 text-base shadow-button transition-transform hover:scale-105"
          >
            {t("startCta")}
            <ArrowRight className="ml-2 size-5" />
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">{t("duration")}</p>
        </div>
      </div>
    </section>
  );
}
