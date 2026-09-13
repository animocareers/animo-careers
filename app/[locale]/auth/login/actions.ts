"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createLoginSchema } from "@/lib/validation/auth";

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

/** Validates login credentials and starts an authenticated Supabase session. */
export async function signIn(locale: string, values: unknown): Promise<LoginState> {
  const t = await getTranslations({ locale, namespace: "LoginPage.form" });
  const schema = createLoginSchema(t);
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: t("genericError") };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { status: "error", message: t("emailNotConfirmed") };
    }
    if (error.code === "invalid_credentials") {
      return { status: "error", message: t("invalidCredentials") };
    }
    return { status: "error", message: t("genericError") };
  }

  redirect(`/${locale}/dashboard`);
}
