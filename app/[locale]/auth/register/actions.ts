"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createSignUpSchema } from "@/lib/validation/auth";

export type SignUpState =
  | { status: "success" }
  | { status: "error"; fieldErrors?: Partial<Record<"email", string>>; message?: string };

/** Validates registration details and creates a Supabase account. */
export async function signUp(locale: string, values: unknown): Promise<SignUpState> {
  const t = await getTranslations({ locale, namespace: "SignupPage.form" });
  const schema = createSignUpSchema(t);
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: t("signupFailed") };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${origin}/${locale}/auth/confirm?next=/${locale}/dashboard`,
    },
  });

  if (error) {
    // Don't reveal via a field error that this email is already registered —
    // that would let an attacker enumerate accounts. Report the same outcome
    // as a genuine new signup; account recovery/resend is a separate flow.
    if (error.code === "email_exists") {
      return { status: "success" };
    }
    return { status: "error", message: t("signupFailed") };
  }

  // Supabase masks duplicate signups for unconfirmed accounts: it returns no
  // error, but `identities` comes back empty instead of containing the new
  // identity. That's the only signal that this wasn't actually a new signup.
  // Keep that masking intact rather than exposing it via a field error.
  if (data.user && data.user.identities?.length === 0) {
    return { status: "success" };
  }

  // If the project has email confirmation disabled, signUp already returns an
  // active session — the account is immediately usable, so skip the "check
  // your email" step and go straight in.
  if (data.session) {
    redirect(`/${locale}/dashboard`);
  }

  return { status: "success" };
}
