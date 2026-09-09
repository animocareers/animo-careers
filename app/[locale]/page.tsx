import { Compass, LayoutGrid, PhoneCall } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AudienceBentoGrid } from "@/components/landing-page/home/audience-bento-grid";
import { Hero } from "@/components/landing-page/home/hero";
import { FeatureGrid, type FeatureGridItem } from "@/components/landing-page/shared/feature-grid";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { buildPageMetadata } from "@/lib/metadata";

const featureIcons: Pick<FeatureGridItem, "icon" | "color">[] = [
  { icon: Compass, color: "primary" },
  { icon: PhoneCall, color: "accent" },
  { icon: LayoutGrid, color: "school" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "HomePage");
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage.features");
  const rawItems = t.raw("items") as { title: string; description: string }[];
  const items: FeatureGridItem[] = rawItems.map((item, i) => ({
    ...item,
    ...featureIcons[i],
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <AudienceBentoGrid />
        <FeatureGrid
          heading={t("heading")}
          subheading={t("subheading")}
          items={items}
        />
      </main>
      <Footer />
    </>
  );
}
