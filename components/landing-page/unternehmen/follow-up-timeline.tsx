import { getTranslations } from "next-intl/server";

const days = ["day0", "day7", "day8", "day10"] as const;

export async function FollowUpTimeline() {
  const t = await getTranslations("UnternehmenPage.timeline");

  return (
    <div className="rounded-4xl border bg-card p-6 shadow-card md:p-8">
      <h3 className="mb-1 text-lg font-semibold">{t("heading")}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{t("subheading")}</p>
      <ol className="relative flex flex-col gap-6 border-l pl-6">
        {days.map((key) => (
          <li key={key} className="relative">
            <span
              className="absolute top-1.5 -left-[27px] size-2.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-primary">{t(`${key}.label`)}</p>
            <p className="text-sm text-muted-foreground">{t(`${key}.description`)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
