import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { BookingWizard } from "@/components/landing-page/schueler/booking-wizard";
import { Hero } from "@/components/landing-page/schueler/hero";
import { WhySection } from "@/components/landing-page/schueler/why-section";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "SchuelerPage");
}

export default async function SchuelerPage({ params }: PageProps<"/[locale]/schueler">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <BookingWizard />
        <WhySection />
      </main>
      <Footer />
    </>
  );
}
