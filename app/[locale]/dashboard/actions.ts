"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Ends the current Supabase session and returns the user to the login page. */
export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/auth/login`);
}
