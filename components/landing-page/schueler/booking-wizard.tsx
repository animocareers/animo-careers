"use client";

import { Check, PartyPopper, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepId = 1 | 2 | 3 | 4 | 5;

const STEP_IDS: StepId[] = [1, 2, 3, 4, 5];

const STEP_OPTIONS: Record<Exclude<StepId, 5>, string[]> = {
  1: ["mechatronik", "elektronik", "lagerlogistik", "industriemechanik", "handwerk", "buero"],
  2: ["halfDay", "fullDay", "multiDay", "week"],
  3: ["thisMonth", "nextMonth", "summerBreak", "flexible"],
  4: ["nearby", "city", "region", "anywhere"],
};

export function BookingWizard() {
  const t = useTranslations("SchuelerPage.wizard");
  const [step, setStep] = useState<StepId>(1);
  const [selections, setSelections] = useState<Partial<Record<StepId, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const stepLabels = STEP_IDS.map((id) => t(`steps.${id}`));

  function selectOption(currentStep: Exclude<StepId, 5>, option: string) {
    setSelections((prev) => ({ ...prev, [currentStep]: option }));
  }

  function goNext() {
    if (step < 5) setStep((prev) => (prev + 1) as StepId);
  }

  function goBack() {
    if (step > 1) setStep((prev) => (prev - 1) as StepId);
  }

  if (submitted) {
    return (
      <div
        id="wizard"
        className="container relative overflow-hidden py-16 text-center md:py-24"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "animate-confetti absolute top-0 block size-2 rounded-sm",
                i % 3 === 0
                  ? "bg-primary"
                  : i % 3 === 1
                    ? "bg-secondary"
                    : "bg-accent"
              )}
              style={{
                left: `${(i * 6.25) % 100}%`,
                animationDelay: `${(i % 5) * 0.3}s`,
              }}
            />
          ))}
        </div>
        <div className="animate-scale-in mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
          <PartyPopper className="size-10 text-primary-foreground" />
        </div>
        <h2 className="mt-6 text-3xl md:text-4xl">{t("successTitle")}</h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          {t("successDescription")}
        </p>
      </div>
    );
  }

  return (
    <div id="wizard" className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl rounded-4xl border bg-card p-6 shadow-card md:p-10">
        <div className="mb-8 flex items-center gap-2">
          {STEP_IDS.map((id) => (
            <div
              key={id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                id <= step ? "bg-gradient-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <p className="text-sm font-semibold text-primary">
          {t("stepLabel", { current: step, total: 5 })}
        </p>
        <h3 className="mt-1 text-2xl">{stepLabels[step - 1]}</h3>

        {step !== 5 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STEP_OPTIONS[step].map((option) => {
              const active = selections[step] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOption(step, option)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {t(`options.${step}.${option}`)}
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring"
            />
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring"
            />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="rounded-full"
            disabled={step === 1}
            onClick={goBack}
          >
            {t("back")}
          </Button>
          {step < 5 ? (
            <Button
              className="rounded-full bg-gradient-primary shadow-button"
              disabled={!selections[step]}
              onClick={goNext}
            >
              {t("next")}
            </Button>
          ) : (
            <Button
              className="rounded-full bg-gradient-primary shadow-button"
              onClick={() => setSubmitted(true)}
            >
              <Sparkles className="mr-1 size-4" />
              {t("submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
