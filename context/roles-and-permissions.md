# Animo — Roles & Permissions

## Roles

| Role | Scope | Summary |
|---|---|---|
| `owner` | Always org-wide | Full control, including billing (Phase 3) and deleting the organization |
| `admin` | Always org-wide | Everything except billing |
| `head_of_apprenticeship` | Org-wide by default, or scoped to one branch | Manage pipeline stages, checklists, professions; assign tasks; process applications |
| `team_member` | Typically scoped to one branch | Process applications (checklist, notes, stage moves within permission); no configuration access |
| *(unauthenticated) applicant* | N/A | Can only submit the public application form — no read access to anything |

**One user belongs to exactly one organization.** `organization_members.user_id` is unique. There is no "switch organization" concept in the product — an email invited to a second org while already active in another is rejected.

**Branch scoping**: a member's `branch_id` is either `NULL` (sees/acts on the whole organization) or set to one specific branch (sees/acts on that branch only). `owner` and `admin` are always `NULL` (org-wide); `head_of_apprenticeship` and `team_member` can be either, decided at invite time.

## Permission matrix

| Capability | owner | admin | head_of_apprenticeship | team_member | applicant |
|---|---|---|---|---|---|
| Create organization | ✅ (self, once) | – | – | – | – |
| Manage branches | ✅ | ✅ | – | – | – |
| Select/edit offered professions | ✅ | ✅ | ✅ | – | – |
| Manage pipeline stages & checklist templates | ✅ | ✅ | ✅ | – | – |
| Invite/remove team members | ✅ | ✅ | – | – | – |
| View applications (their scope: org-wide or their branch) | ✅ | ✅ | ✅ | ✅ | – |
| Move an application between stages | ✅ | ✅ | ✅ | ✅ (within their branch) | – |
| Toggle/assign checklist items | ✅ | ✅ | ✅ | ✅ | – |
| Add notes | ✅ | ✅ | ✅ | ✅ | – |
| Set confirmed dates | ✅ | ✅ | ✅ | ✅ | – |
| Generate/rotate embed links | ✅ | ✅ | – | – | – |
| View audit log | ✅ | ✅ | – | – | – |
| Delete organization | ✅ | – | – | – | – |
| Submit an application | – | – | – | – | ✅ |

## Enforcement

Every row in this matrix maps to a Postgres RLS policy (see `database-design.md`), not just a UI-level check — a `team_member` hitting the API directly must be stopped by the database, not merely by a hidden button. Server Actions add role checks for operations that combine multiple table writes (e.g. `inviteMember` requires `owner`/`admin` before touching `invitations`).

## Public applicant access

Applicants never authenticate. Their only interaction is `POST /api/public-apply` (see `api-design.md`), which writes on their behalf via the service-role client after validation — they never have a session, a role, or read access to any table.
