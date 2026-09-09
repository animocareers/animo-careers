import { getTranslations } from "next-intl/server";

const emojiKeys = ["item1", "item2", "item3"] as const;
const emojis = ["👀", "💡", "🎯"];

export async function WhySection() {
  const t = await getTranslations("SchuelerPage.why");

  return (
    <section className="container py-16 md:py-24">
      <h2 className="mb-12 text-center text-3xl md:text-4xl">{t("heading")}</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {emojiKeys.map((key, i) => (
          <div key={key} className="flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">{emojis[i]}</span>
            <h3 className="text-xl">{t(`${key}.title`)}</h3>
            <p className="leading-relaxed text-muted-foreground">
              {t(`${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
