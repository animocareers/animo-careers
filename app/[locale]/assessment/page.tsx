import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { AssessmentIntro } from "@/components/landing-page/assessment/assessment-intro";
import { Footer } from "@/components/landing-page/shared/footer";
import { Header } from "@/components/landing-page/shared/header";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "AssessmentPage");
}

export default async function AssessmentPage({
  params,
}: PageProps<"/[locale]/assessment">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="flex-1">
        <AssessmentIntro />
      </main>
      <Footer />
    </>
  );
}
