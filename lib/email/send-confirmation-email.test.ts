import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "@/lib/email/providers/console-log";
import { sendApplicationConfirmationEmail } from "@/lib/email/send-confirmation-email";

vi.mock("@/lib/email/providers/console-log", () => ({
  sendEmail: vi.fn(),
}));

const sendEmailMock = vi.mocked(sendEmail);

function validInput(overrides: Partial<Parameters<typeof sendApplicationConfirmationEmail>[0]> = {}) {
  return {
    to: "max@example.com",
    applicantFirstName: "Max",
    organizationName: "Acme GmbH",
    branchName: "Berlin",
    professionName: "Tischler",
    requestedStartDate: "2026-06-01",
    requestedEndDate: "2026-06-30",
    ...overrides,
  };
}

describe("sendApplicationConfirmationEmail", () => {
  beforeEach(() => {
    sendEmailMock.mockReset().mockResolvedValue(undefined);
  });

  it("sends to the applicant's address", async () => {
    await sendApplicationConfirmationEmail(validInput());
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "max@example.com" }),
    );
  });

  it("includes the applicant's name, organization, branch, and profession in the body", async () => {
    await sendApplicationConfirmationEmail(validInput());
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).toContain("Max");
    expect(textBody).toContain("Acme GmbH");
    expect(textBody).toContain("Berlin");
    expect(textBody).toContain("Tischler");
  });

  it("includes the requested dates when given", async () => {
    await sendApplicationConfirmationEmail(validInput());
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).toContain("2026-06-01");
    expect(textBody).toContain("2026-06-30");
  });

  it("shows a 'no dates given yet' message when dates are null", async () => {
    await sendApplicationConfirmationEmail(
      validInput({ requestedStartDate: null, requestedEndDate: null }),
    );
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).not.toContain("Gewünschter Zeitraum");
  });

  it("omits the branch parenthetical when there is no branch", async () => {
    await sendApplicationConfirmationEmail(validInput({ branchName: null }));
    const { textBody } = sendEmailMock.mock.calls[0][0];
    expect(textBody).not.toContain("()");
  });

  it("propagates a provider failure rather than swallowing it", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("provider down"));
    await expect(sendApplicationConfirmationEmail(validInput())).rejects.toThrow("provider down");
  });
});
