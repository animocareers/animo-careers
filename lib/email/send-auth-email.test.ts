import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "@/lib/email/providers";
import { sendAuthEmail } from "@/lib/email/send-auth-email";

vi.mock("@/lib/email/providers", () => ({
  sendEmail: vi.fn(),
}));

const sendEmailMock = vi.mocked(sendEmail);

function validInput(overrides: Partial<Parameters<typeof sendAuthEmail>[0]> = {}) {
  return {
    to: "max@example.com",
    locale: "de",
    firstName: "Max",
    confirmationUrl: "https://animo.app/de/auth/confirm?token_hash=abc&type=signup",
    emailActionType: "signup",
    ...overrides,
  };
}

describe("sendAuthEmail", () => {
  beforeEach(() => {
    sendEmailMock.mockReset().mockResolvedValue(undefined);
  });

  it("sends to the user's address", async () => {
    await sendAuthEmail(validInput());
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "max@example.com" }),
    );
  });

  it("includes the confirmation link and the user's name for signup", async () => {
    await sendAuthEmail(validInput());
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).toContain("Max");
    expect(textBody).toContain("https://animo.app/de/auth/confirm?token_hash=abc&type=signup");
  });

  it("falls back to a generic greeting when no first name is known", async () => {
    await sendAuthEmail(validInput({ firstName: null }));
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).toContain("Hallo,");
  });

  it("renders English copy for the en locale", async () => {
    await sendAuthEmail(validInput({ locale: "en" }));
    const { subject, textBody } = sendEmailMock.mock.calls[0][0];
    expect(subject).toBe("Confirm your email address for animo");
    expect(textBody).toContain("Hi Max,");
  });

  it("falls back to English for an unrecognized locale", async () => {
    await sendAuthEmail(validInput({ locale: "fr" }));
    const { subject } = sendEmailMock.mock.calls[0][0];
    expect(subject).toBe("Confirm your email address for animo");
  });

  it("uses a generic template for non-signup action types", async () => {
    await sendAuthEmail(validInput({ emailActionType: "recovery" }));
    const { subject } = sendEmailMock.mock.calls[0][0];
    expect(subject).toBe("Bestätige deine Anfrage bei animo");
  });

  it("propagates a provider failure rather than swallowing it", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("provider down"));
    await expect(sendAuthEmail(validInput())).rejects.toThrow("provider down");
  });
});
