import { z } from "zod";

/** Creates the localized validation schema for account registration. */
export function createSignUpSchema(t: (key: string) => string) {
  return z
    .object({
      firstName: z.string().trim().min(1, { error: t("required") }),
      lastName: z.string().trim().min(1, { error: t("required") }),
      email: z.email({ error: t("invalidEmail") }).trim(),
      password: z.string().min(8, { error: t("passwordTooShort") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      error: t("passwordsDontMatch"),
    });
}

export type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;

/** Creates the localized validation schema for login credentials. */
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.email({ error: t("invalidEmail") }).trim(),
    password: z.string().min(1, { error: t("required") }),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
