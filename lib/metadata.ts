import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function buildPageMetadata(
  locale: string,
  namespace: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
