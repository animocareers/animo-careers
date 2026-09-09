import { Bot, CalendarCheck, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { FeatureGrid, type FeatureGridItem } from "@/components/landing-page/shared/feature-grid";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { PricingNote } from "@/components/landing-page/shared/pricing-note";
import { Hero } from "@/components/landing-page/schulen/hero";
import { TeacherDashboardPreview } from "@/components/landing-page/schulen/teacher-dashboard-preview";
import { buildPageMetadata } from "@/lib/metadata";

const toolIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: Bot, color: "primary" },
  { icon: CalendarCheck, color: "accent" },
  { icon: LayoutDashboard, color: "school" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "SchulenPage");
}

export default async function SchulenPage({ params }: PageProps<"/[locale]/schulen">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("SchulenPage");
  const tFeatures = await getTranslations("SchulenPage.tools");
  const rawItems = tFeatures.raw("items") as { title: string; description: string }[];
  const items: FeatureGridItem[] = rawItems.map((item, i) => ({
    ...item,
    ...toolIcons[i],
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <FeatureGrid items={items} />

        <section className="container py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl md:text-4xl">{t("dashboardSection.heading")}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("dashboardSection.description")}
              </p>
            </div>
            <TeacherDashboardPreview />
          </div>
        </section>

        <section className="container flex justify-center pb-16">
          <PricingNote
            badge={t("pricing.badge")}
            text={t("pricing.text")}
          />
        </section>

        <CtaSection
          heading={t("cta.heading")}
          description={t("cta.description")}
          ctaLabel={t("cta.label")}
          ctaHref="/schulen"
        />
      </main>
      <Footer />
    </>
  );
}
