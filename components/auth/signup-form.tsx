"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { createSignUpSchema, type SignUpFormValues } from "@/lib/validation/auth";

export function SignupForm() {
  const t = useTranslations("SignupPage.form");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(createSignUpSchema(t)) });

  async function onSubmit(values: SignUpFormValues) {
    // TODO: replace with supabase.auth.signUp() once backend wiring is implemented (see lib/client.ts)
    console.log(values);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-heading font-black tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">{t("firstNameLabel")}</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder={t("firstNamePlaceholder")}
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">{t("lastNameLabel")}</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder={t("lastNamePlaceholder")}
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

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
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("confirmPasswordPlaceholder")}
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-primary shadow-button"
        >
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
