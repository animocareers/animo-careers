import { getTranslations } from "next-intl/server";

export async function PartnerLogosStrip() {
  const t = await getTranslations("PartnerPage.partners");
  const items = t.raw("items") as string[];

  return (
    <div className="container py-10">
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        {t("heading")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {items.map((name) => (
          <span
            key={name}
            className="font-heading text-lg font-bold text-muted-foreground/70"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
