import { Clock, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/landing-page/eltern/hero";
import { CtaSection } from "@/components/landing-page/shared/cta-section";
import { FaqAccordion, type FaqItem } from "@/components/landing-page/shared/faq-accordion";
import { FeatureGrid, type FeatureGridItem } from "@/components/landing-page/shared/feature-grid";
import { Footer } from "@/components/landing-page/shared/footer";
import { FounderBio } from "@/components/landing-page/shared/founder-bio";
import { Header } from "@/components/landing-page/shared/header";
import { PricingNote } from "@/components/landing-page/shared/pricing-note";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/metadata";

const processEmojis = ["💬", "👀", "💡"];

const assuranceIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: ShieldCheck, color: "primary" },
  { icon: UserCheck, color: "accent" },
  { icon: Clock, color: "school" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "ElternPage");
}

export default async function ElternPage({ params }: PageProps<"/[locale]/eltern">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ElternPage");
  const tAssurance = await getTranslations("ElternPage.assurance");
  const rawAssuranceItems = tAssurance.raw("items") as { title: string; description: string }[];
  const assuranceItems: FeatureGridItem[] = rawAssuranceItems.map((item, i) => ({
    ...item,
    ...assuranceIcons[i],
  }));
  const processItems = t.raw("process.items") as { title: string; description: string }[];
  const faqItems = t.raw("faq.items") as FaqItem[];

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <FeatureGrid items={assuranceItems} />

        <section className="container py-16 md:py-24">
          <h2 className="mb-12 text-center text-3xl md:text-4xl">
            {t("process.heading")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {processItems.map((item, i) => (
              <div key={item.title} className="flex flex-col items-center gap-4 text-center">
                <span className="text-4xl">{processEmojis[i]}</span>
                <h3 className="text-xl">{item.title}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-16">
          <FounderBio
            initials="HG"
            name={t("founder.name")}
            role={t("founder.role")}
            quote={t("founder.quote")}
          >
            <Link href="/ueber-uns" className="text-sm font-semibold text-primary hover:underline">
              {t("founder.link")}
            </Link>
          </FounderBio>
        </section>

        <section className="container pb-16 md:pb-24">
          <h2 className="mb-10 text-center text-3xl md:text-4xl">{t("faq.heading")}</h2>
          <FaqAccordion items={faqItems} />
        </section>

        <section className="container flex justify-center pb-16">
          <PricingNote badge={t("pricing.badge")} text={t("pricing.text")} />
        </section>

        <CtaSection
          heading={t("cta.heading")}
          description={t("cta.description")}
          ctaLabel={t("cta.label")}
          ctaHref="/eltern"
          secondaryLabel={t("cta.secondaryLabel")}
          secondaryHref="/ueber-uns"
        />
      </main>
      <Footer />
    </>
  );
}
