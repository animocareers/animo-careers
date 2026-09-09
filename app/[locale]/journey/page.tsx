import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { Hero } from "@/components/landing-page/journey/hero";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "JourneyPage");
}

export default async function JourneyPage({ params }: PageProps<"/[locale]/journey">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("JourneyPage");
  const steps = t.raw("process.steps") as { title: string; description: string }[];

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        <section className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">{t("process.eyebrow")}</p>
            <h2 className="mt-2 text-3xl md:text-4xl">{t("process.heading")}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="text-xl">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-16 text-center">
          <p className="mx-auto max-w-2xl text-lg leading-relaxed italic text-muted-foreground">
            &ldquo;{t("quote")}&rdquo;
          </p>
          <p className="mt-3 text-sm font-medium">{t("quoteAttribution")}</p>
          <Link
            href="/eltern"
            className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {t("parentsLink")}
          </Link>
        </section>

        <CtaSection
          heading={t("cta.heading")}
          description={t("cta.description")}
          ctaLabel={t("cta.label")}
          ctaHref="/journey"
        />
      </main>
      <Footer />
    </>
  );
}
