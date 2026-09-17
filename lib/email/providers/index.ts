import { sendEmail as sendViaConsole } from "@/lib/email/providers/console-log";
import { sendEmail as sendViaResend } from "@/lib/email/providers/resend";

export type { SendEmailInput } from "@/lib/email/providers/types";

/** Resend when RESEND_API_KEY is configured (staging/production, per deployment.md), console-log stub otherwise (local dev). */
export const sendEmail = process.env.RESEND_API_KEY ? sendViaResend : sendViaConsole;
