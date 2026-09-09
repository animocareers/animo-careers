import { CheckCircle2, Compass, HeartHandshake, HeartPulse, ListChecks, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { FeatureGrid, type FeatureGridItem } from "@/components/landing-page/shared/feature-grid";
import { Footer } from "@/components/landing-page/shared/footer";
import { FounderBio } from "@/components/landing-page/shared/founder-bio";
import { Header } from "@/components/landing-page/shared/header";
import { StatCallout } from "@/components/landing-page/ueber-uns/stat-callout";
import { buildPageMetadata } from "@/lib/metadata";

const helpIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: ListChecks, color: "primary" },
  { icon: Compass, color: "accent" },
  { icon: HeartHandshake, color: "school" },
];

const benefitIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: Sparkles, color: "primary" },
  { icon: CheckCircle2, color: "accent" },
  { icon: HeartPulse, color: "school" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "UeberUnsPage");
}

export default async function UeberUnsPage({ params }: PageProps<"/[locale]/ueber-uns">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UeberUnsPage");
  const rawHelpItems = t.raw("help.items") as { title: string; description: string }[];
  const helpItems: FeatureGridItem[] = rawHelpItems.map((item, i) => ({
    ...item,
    ...helpIcons[i],
  }));
  const rawBenefitItems = t.raw("benefits.items") as { title: string; description: string }[];
  const benefitItems: FeatureGridItem[] = rawBenefitItems.map((item, i) => ({
    ...item,
    ...benefitIcons[i],
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-mesh">
          <div className="container py-16 md:py-24">
            <FounderBio
              initials="HG"
              name={t("founder.name")}
              role={t("founder.role")}
              quote={t("founder.openingQuote")}
              quoteAs="h1"
              size="lg"
            />
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl md:text-4xl">{t("story.heading")}</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("story.paragraph1")}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {t("story.paragraph2")}
            </p>
            <div className="flex justify-center py-4">
              <StatCallout value={t("story.statValue")} label={t("story.statLabel")} />
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {t("story.paragraph3")}
            </p>
          </div>
        </section>

        <FeatureGrid heading={t("help.heading")} items={helpItems} />
        <FeatureGrid heading={t("benefits.heading")} items={benefitItems} />

        <section className="container pb-16 text-center">
          <p className="mx-auto max-w-2xl text-xl leading-relaxed font-medium italic">
            &ldquo;{t("closingQuote")}&rdquo;
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("closingAttribution")}</p>
        </section>

        <CtaSection
          heading={t("cta.heading")}
          ctaLabel={t("cta.label")}
          ctaHref="/journey"
        />
      </main>
      <Footer />
    </>
  );
}
