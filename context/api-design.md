# Animo — API Design

Animo's "backend" is Next.js Server Actions and Route Handlers calling Supabase directly, with **Postgres RLS as the actual authorization boundary** for most operations — not a traditional REST API with its own auth middleware. This doc catalogs both: (a) direct table operations governed by RLS, and (b) explicit Route Handlers for logic that doesn't fit direct table access.

## A. Direct table operations (via Supabase client, RLS-governed)

Called from Server Components (reads) or Server Actions (writes), using the server Supabase client so the user's session is attached and RLS applies automatically. No custom endpoint needed for most of these.

| Operation | Table(s) | Notes |
|---|---|---|
| List/read organization | `organizations` | Scoped by the caller's membership |
| List/manage branches | `branches` | Create/edit: `owner`/`admin` only (enforced by RLS + role check) |
| List/select professions | `organization_professions`, `profession_catalog` | 2–15 cap enforced by a trigger or Server Action check |
| Manage pipeline stages | `pipeline_stages` | Reorder = position update |
| Manage checklist templates | `checklist_templates` | Scoped via parent `pipeline_stages.organization_id` |
| List/read applications | `applications` | RLS applies org + branch scoping automatically |
| Update application (stage, dates) | `applications` | Stage change triggers checklist-item cloning (Server Action, see below) |
| Toggle checklist item | `application_checklist_items` | |
| Assign checklist item | `application_checklist_items` | |
| Add note | `application_notes` | Append-only from the UI's perspective |
| List/manage invitations | `invitations` | Create: `owner`/`admin` only |

## B. Server Actions with embedded business logic

These wrap a table write with logic that shouldn't live in the client.

### `moveApplicationToStage(applicationId, newStageId)`
1. Verifies the caller can update this application (RLS + role).
2. Updates `applications.current_stage_id`.
3. Clones `checklist_templates` rows for `newStageId` into `application_checklist_items` for this application.
4. Writes an `audit_logs` entry.

### `createOrganization(input)`
1. Creates the `organizations` row.
2. Creates the default `branches` row ("Main").
3. Creates the `organization_members` row for the calling user with role `owner`.
4. Seeds the default 6 `pipeline_stages` + `checklist_templates`.

### `inviteMember(input: { email, role, branchId? })`
1. Confirms caller is `owner`/`admin`.
2. Creates an `invitations` row with a token, sends the invite email.

### `acceptInvitation(token, password)`
1. Validates the token (not expired, not already accepted).
2. Creates the Supabase Auth user (or rejects if the email is already an active member of a *different* org — see `roles-and-permissions.md`).
3. Creates the `organization_members` row from the invitation's org/role/branch.
4. Marks the invitation accepted.

## C. Route Handlers (for untrusted input / non-table logic)

### `POST /api/public-apply`

Public, unauthenticated. The only write path into `applications` from outside the authenticated dashboard.

**Request body:**
```json
{
  "orgSlug": "string",
  "branchSlug": "string | null",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "organizationProfessionId": "uuid",
  "scope": "single_profession | orientierungspraktikum",
  "isSchoolMandatory": "boolean",
  "requestedStartDate": "YYYY-MM-DD | null",
  "requestedEndDate": "YYYY-MM-DD | null",
  "turnstileToken": "string"
}
```

**Server-side steps:**
1. Verify `turnstileToken` with Cloudflare.
2. Validate the full payload against the shared Zod schema.
3. Resolve `orgSlug`/`branchSlug` → confirm `organizationProfessionId` actually belongs to that org.
4. Insert into `applications` using the service-role client (bypasses RLS deliberately — this is the one legitimate unauthenticated write path).

**Responses:**
- `201` — `{ "applicationId": "uuid" }`
- `400` — validation error, field-level messages
- `403` — Turnstile check failed
- `404` — unknown `orgSlug`/`branchSlug`

### `POST /api/invitations/accept`

Thin wrapper if invitation acceptance needs to happen before a session exists (e.g. combined with Supabase Auth signup in one request) — otherwise implement as the Server Action in section B.

## Error handling conventions

- **Validation errors**: `400`, field-level messages from the shared Zod schema (same schema used for client-side form validation, so error messages are consistent).
- **Authorization failures**: rely on RLS returning zero rows rather than a distinct "403" for most table reads — a query that returns nothing because RLS filtered it out should render as "not found," not leak that the record exists in another org.
- **Unexpected errors**: logged to Sentry with request context (never the raw applicant PII in the log payload).
