import { Webhook } from "standardwebhooks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handleSendEmailHook } from "@/lib/auth/send-email-hook";

const SECRET_BASE64 = Buffer.from("test-signing-secret-0123456789ab").toString("base64");

function signedHeaders(payload: string): Record<string, string> {
  const wh = new Webhook(SECRET_BASE64);
  const id = "msg_test";
  const timestamp = new Date();
  return {
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": wh.sign(id, timestamp, payload),
  };
}

function samplePayload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    user: {
      email: "max@example.com",
      user_metadata: { first_name: "Max" },
    },
    email_data: {
      token_hash: "token_hash_value",
      email_action_type: "signup",
      redirect_to: "http://localhost:3000/de/auth/confirm?next=/de/dashboard",
      site_url: "http://localhost:3000",
    },
    ...overrides,
  });
}

describe("handleSendEmailHook", () => {
  beforeEach(() => {
    process.env.SEND_EMAIL_HOOK_SECRET = `v1,whsec_${SECRET_BASE64}`;
  });

  afterEach(() => {
    delete process.env.SEND_EMAIL_HOOK_SECRET;
  });

  it("sends the auth email and returns success for a validly signed signup payload", async () => {
    const payload = samplePayload();
    const sendAuthEmailMock = vi.fn().mockResolvedValue(undefined);

    const result = await handleSendEmailHook(payload, signedHeaders(payload), {
      sendAuthEmail: sendAuthEmailMock,
    });

    expect(result).toEqual({ status: "success" });
    expect(sendAuthEmailMock).toHaveBeenCalledWith({
      to: "max@example.com",
      locale: "de",
      firstName: "Max",
      confirmationUrl:
        "http://localhost:3000/de/auth/confirm?next=%2Fde%2Fdashboard&token_hash=token_hash_value&type=signup",
      emailActionType: "signup",
    });
  });

  it("rejects a payload with an invalid signature", async () => {
    const payload = samplePayload();

    const result = await handleSendEmailHook(payload, {
      "webhook-id": "msg_test",
      "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
      "webhook-signature": "v1,not-a-real-signature",
    });

    expect(result).toEqual({ status: "invalid_signature" });
  });

  it("rejects a validly signed payload that doesn't match the expected shape", async () => {
    const payload = JSON.stringify({ nope: true });

    const result = await handleSendEmailHook(payload, signedHeaders(payload));

    expect(result).toEqual({ status: "invalid_payload" });
  });

  it("falls back to the default locale when redirect_to has no recognized locale segment", async () => {
    const payload = samplePayload({
      email_data: {
        token_hash: "token_hash_value",
        email_action_type: "signup",
        redirect_to: "http://localhost:3000/auth/confirm",
        site_url: "http://localhost:3000",
      },
    });
    const sendAuthEmailMock = vi.fn().mockResolvedValue(undefined);

    await handleSendEmailHook(payload, signedHeaders(payload), {
      sendAuthEmail: sendAuthEmailMock,
    });

    expect(sendAuthEmailMock).toHaveBeenCalledWith(expect.objectContaining({ locale: "en" }));
  });

  it("sends two emails for a secure email change, with tokens paired per Supabase's reversed convention", async () => {
    const payload = samplePayload({
      user: {
        email: "max@example.com",
        new_email: "max+new@example.com",
        user_metadata: { first_name: "Max" },
      },
      email_data: {
        token_hash: "token_for_new_address",
        token_hash_new: "token_for_current_address",
        email_action_type: "email_change",
        redirect_to: "http://localhost:3000/de/auth/confirm?next=/de/dashboard",
        site_url: "http://localhost:3000",
      },
    });
    const sendAuthEmailMock = vi.fn().mockResolvedValue(undefined);

    const result = await handleSendEmailHook(payload, signedHeaders(payload), {
      sendAuthEmail: sendAuthEmailMock,
    });

    expect(result).toEqual({ status: "success" });
    expect(sendAuthEmailMock).toHaveBeenNthCalledWith(1, {
      to: "max@example.com",
      locale: "de",
      firstName: "Max",
      confirmationUrl:
        "http://localhost:3000/de/auth/confirm?next=%2Fde%2Fdashboard&token_hash=token_for_current_address&type=email_change",
      emailActionType: "email_change",
    });
    expect(sendAuthEmailMock).toHaveBeenNthCalledWith(2, {
      to: "max+new@example.com",
      locale: "de",
      firstName: "Max",
      confirmationUrl:
        "http://localhost:3000/de/auth/confirm?next=%2Fde%2Fdashboard&token_hash=token_for_new_address&type=email_change",
      emailActionType: "email_change",
    });
  });

  it("builds a working default-locale confirm link when redirect_to is empty", async () => {
    const payload = samplePayload({
      email_data: {
        token_hash: "token_hash_value",
        email_action_type: "signup",
        redirect_to: "",
        site_url: "http://localhost:3000",
      },
    });
    const sendAuthEmailMock = vi.fn().mockResolvedValue(undefined);

    await handleSendEmailHook(payload, signedHeaders(payload), {
      sendAuthEmail: sendAuthEmailMock,
    });

    expect(sendAuthEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmationUrl: "http://localhost:3000/en/auth/confirm?token_hash=token_hash_value&type=signup",
      }),
    );
  });

  it("returns send_failed when the email fails to send", async () => {
    const payload = samplePayload();

    const result = await handleSendEmailHook(payload, signedHeaders(payload), {
      sendAuthEmail: vi.fn().mockRejectedValue(new Error("provider down")),
    });

    expect(result).toEqual({ status: "send_failed" });
  });

  it("throws when SEND_EMAIL_HOOK_SECRET is not configured", async () => {
    delete process.env.SEND_EMAIL_HOOK_SECRET;
    const payload = samplePayload();

    await expect(handleSendEmailHook(payload, signedHeaders(payload))).rejects.toThrow(
      "SEND_EMAIL_HOOK_SECRET is not set",
    );
  });
});
