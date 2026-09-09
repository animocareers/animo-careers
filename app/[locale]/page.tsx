import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <LocaleSwitcher />
        <ModeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
    </div>
  );
}
