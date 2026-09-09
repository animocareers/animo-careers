import { Radar, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { EyebrowBadge } from "@/components/landing-page/shared/eyebrow-badge";
import { FeatureGrid, type FeatureGridItem } from "@/components/landing-page/shared/feature-grid";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { Hero } from "@/components/landing-page/partner/hero";
import { PartnerLogosStrip } from "@/components/landing-page/partner/partner-logos-strip";
import { buildPageMetadata } from "@/lib/metadata";

const agentIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: TrendingUp, color: "primary" },
  { icon: Users, color: "accent" },
  { icon: Radar, color: "school" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "PartnerPage");
}

export default async function PartnerPage({ params }: PageProps<"/[locale]/partner">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PartnerPage");
  const tFeatures = await getTranslations("PartnerPage.agent");
  const rawItems = tFeatures.raw("items") as { title: string; description: string }[];
  const items: FeatureGridItem[] = rawItems.map((item, i) => ({
    ...item,
    ...agentIcons[i],
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <PartnerLogosStrip />

        <section className="container py-16 text-center md:py-24">
          <EyebrowBadge className="mx-auto mb-6">
            {t("agent.eyebrow")}
          </EyebrowBadge>
          <h2 className="mx-auto max-w-2xl text-3xl md:text-4xl">
            {t("agent.heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("agent.subheading")}
          </p>
        </section>
        <FeatureGrid items={items} />

        <section className="container grid gap-8 pb-16 md:grid-cols-2">
          <div className="rounded-3xl border bg-gradient-card p-8">
            <h3 className="text-xl">{t("assured.title")}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t("assured.description")}
            </p>
          </div>
          <div className="rounded-3xl border bg-gradient-card p-8">
            <h3 className="text-xl">{t("integrated.title")}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t("integrated.description")}
            </p>
          </div>
        </section>

        <CtaSection
          heading={t("cta.heading")}
          description={t("cta.description")}
          ctaLabel={t("cta.label")}
          ctaHref="/partner"
        />
      </main>
      <Footer />
    </>
  );
}
