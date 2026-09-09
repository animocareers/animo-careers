import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";

const requests = [
  { initials: "L", name: "Lena M.", role: "Industriemechanik", status: "new" },
  { initials: "J", name: "Jonas K.", role: "Elektronik", status: "review" },
  { initials: "A", name: "Aylin T.", role: "Lagerlogistik", status: "confirmed" },
  { initials: "T", name: "Tim R.", role: "Mechatronik", status: "confirmed" },
] as const;

const statusVariant: Record<(typeof requests)[number]["status"], "default" | "secondary" | "outline"> = {
  new: "outline",
  review: "secondary",
  confirmed: "default",
};

export async function HrPipelinePreview() {
  const t = await getTranslations("UnternehmenPage.pipeline");

  return (
    <div className="rounded-4xl border bg-card p-6 shadow-card md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("heading")}</h3>
        <span className="text-sm text-muted-foreground">{t("openCount")}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-3 rounded-2xl border p-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-company text-sm font-bold text-company-foreground">
              {r.initials}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.role}</p>
            </div>
            <Badge variant={statusVariant[r.status]}>
              {t(`status.${r.status}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
