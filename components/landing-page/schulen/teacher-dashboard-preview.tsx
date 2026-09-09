import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const students = [
  { initials: "L", name: "Lena M.", mood: "😀", progress: 85, status: "safe" },
  { initials: "J", name: "Jonas K.", mood: "🙂", progress: 60, status: "onTrack" },
  { initials: "A", name: "Aylin T.", mood: "😟", progress: 35, status: "needsHelp" },
  { initials: "T", name: "Tim R.", mood: "😐", progress: 50, status: "onTrack" },
] as const;

const summary = [
  { count: 6, key: "safe" },
  { count: 14, key: "onTrack" },
  { count: 4, key: "needsHelp" },
] as const;

const statusVariant: Record<(typeof students)[number]["status"], "default" | "secondary" | "outline"> = {
  safe: "default",
  onTrack: "secondary",
  needsHelp: "outline",
};

export async function TeacherDashboardPreview() {
  const t = await getTranslations("SchulenPage.dashboard");

  return (
    <div className="rounded-4xl border bg-card p-6 shadow-card md:p-8">
      <p className="text-sm font-semibold text-school">{t("className")}</p>
      <h3 className="mt-1 text-xl">{t("overviewHeading")}</h3>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {summary.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl bg-gradient-card p-4 text-center"
          >
            <p className="text-2xl font-black">{item.count}</p>
            <p className="text-xs text-muted-foreground">{t(`status.${item.key}`)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {students.map((student) => (
          <div key={student.name} className="flex items-center gap-3 rounded-2xl border p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-school text-sm font-bold text-school-foreground">
              {student.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{student.name}</p>
                <span aria-hidden="true">{student.mood}</span>
              </div>
              <Progress value={student.progress} className="mt-1.5" />
            </div>
            <Badge variant={statusVariant[student.status]} className="shrink-0">
              {t(`status.${student.status}`)}
            </Badge>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed p-4">
        <p className="mb-2 text-sm font-medium">{t("newQueryLabel")}</p>
        <p className="text-xs text-muted-foreground">{t("newQueryPlaceholder")}</p>
      </div>
    </div>
  );
}
