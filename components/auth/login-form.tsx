"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { signIn } from "@/app/[locale]/auth/login/actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { createLoginSchema, type LoginFormValues } from "@/lib/validation/auth";

interface LoginFormProps {
  locale: string;
  confirmationFailed?: boolean;
}

/** Renders the localized login form and submits credentials to the server. */
export function LoginForm({ locale, confirmationFailed }: LoginFormProps) {
  const t = useTranslations("LoginPage.form");
  const [formError, setFormError] = useState<string | null>(
    confirmationFailed ? t("confirmationFailed") : null
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(createLoginSchema(t)) });

  /** Submits valid credentials and displays authentication errors. */
  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const result = await signIn(locale, values);
    if (result.status === "error") {
      setFormError(result.message);
    }
  }

  return (
    <div className="space-y-6">
      {isSubmitting && <LoadingOverlay label={t("submitting")} />}

      <div className="space-y-1">
        <h2 className="text-2xl font-heading font-black tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-primary shadow-button"
        >
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          {t("signup")}
        </Link>
      </p>
    </div>
  );
}
