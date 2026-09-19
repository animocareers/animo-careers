import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { submitPublicApplication } from "@/lib/application/submit-application";

/**
 * Public, unauthenticated write path for the apply form (feature 08).
 * Re-validates everything server-side and resolves org/branch/profession
 * from the link itself — see lib/application/submit-application.ts for the
 * actual logic; this handler only maps its result onto HTTP responses per
 * api-design.md's documented status codes.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await submitPublicApplication(body);

  switch (result.status) {
    case "success":
      return NextResponse.json(
        { applicationId: result.applicationId, emailSent: result.emailSent },
        { status: 201 },
      );
    case "invalid":
      return NextResponse.json(
        { error: "validation_failed", fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    case "not_found":
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    case "server_error":
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    default:
      result satisfies never;
      return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
