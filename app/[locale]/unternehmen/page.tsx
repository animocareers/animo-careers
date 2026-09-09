import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { FollowUpTimeline } from "@/components/landing-page/unternehmen/follow-up-timeline";
import { Hero } from "@/components/landing-page/unternehmen/hero";
import { HrPipelinePreview } from "@/components/landing-page/unternehmen/hr-pipeline-preview";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "UnternehmenPage");
}

export default async function UnternehmenPage({
  params,
}: PageProps<"/[locale]/unternehmen">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UnternehmenPage");

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        <section className="container py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="text-sm font-semibold text-company">
                {t("product1.eyebrow")}
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl">{t("product1.title")}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("product1.description")}
              </p>
              <ul className="mt-6 space-y-4">
                {(t.raw("product1.features") as { title: string; description: string }[]).map(
                  (feature) => (
                    <li key={feature.title}>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </li>
                  )
                )}
              </ul>
            </div>
            <HrPipelinePreview />
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <FollowUpTimeline />
            <div>
              <span className="text-sm font-semibold text-company">
                {t("product2.eyebrow")}
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl">{t("product2.title")}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("product2.description")}
              </p>
              <ul className="mt-6 space-y-4">
                {(t.raw("product2.features") as { title: string; description: string }[]).map(
                  (feature) => (
                    <li key={feature.title}>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </section>

        <CtaSection
          heading={t("cta.heading")}
          description={t("cta.description")}
          ctaLabel={t("cta.label")}
          ctaHref="/unternehmen"
        />
      </main>
      <Footer />
    </>
  );
}
