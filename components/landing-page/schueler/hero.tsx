import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

const steps = ["step1", "step2", "step3", "step4", "step5"] as const;

export async function Hero() {
  const t = await getTranslations("SchuelerPage.hero");

  return (
    <section className="bg-mesh">
      <div className="container py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.05] font-extrabold sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t("subtitle")}
        </p>

        <ol className="mx-auto mt-12 flex max-w-3xl flex-wrap items-start justify-center gap-x-2 gap-y-6">
          {steps.map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="max-w-20 text-center text-xs font-medium text-muted-foreground">
                  {t(key)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mb-6 h-px w-6 bg-border md:w-10" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Button
            size="lg"
            nativeButton={false}
            className="min-h-14 rounded-full bg-gradient-primary px-8 text-base shadow-button transition-transform hover:scale-105"
            render={
              <a href="#wizard">
                {t("cta")}
                <ArrowRight className="ml-2 size-5" />
              </a>
            }
          />
        </div>
      </div>
    </section>
  );
}
