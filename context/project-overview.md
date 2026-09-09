# Animo — Project Overview

## What is Animo?

Animo is a multi-tenant SaaS platform that helps companies manage their internship / apprenticeship application pipeline end-to-end — from a student clicking "Apply" on the company's own careers page, through review and scheduling, to a confirmed start date.

## Who uses it

- **Company admins / owners** — set up the organization, define which professions/apprenticeships are offered, design the review pipeline, invite team members.
- **Team members** (e.g. "Head of Apprenticeship", supervisors) — process incoming applications day to day: move them through stages, complete checklist tasks, leave notes, schedule dates.
- **Applicants (students)** — fill out a public form linked from the company's own website; no account needed.

## The core problem

Companies offering internships/apprenticeships in Germany currently manage this process ad hoc (email, spreadsheets, paper). Animo gives them:

1. A **public application form** they can link to from their own website.
2. A **configurable pipeline** (Kanban-style) to process applications with role-based checklists.
3. A **calendar view** to reconcile requested vs. confirmed internship dates and spot missing scheduling info.

## Key domain concepts (glossary)

| Term | Meaning |
|---|---|
| **Organization** | A company using Animo. The top-level tenant. |
| **Branch** | A location/site belonging to an organization. Every organization has at least one (default "Main"); larger companies can add more. |
| **Profession** | A specific apprenticeship/internship role, drawn from the German Bundesagentur für Arbeit "Berufe A–Z" catalog. Each organization selects 2–15 it offers. |
| **Pipeline Stage** | A step in the org's review process (default: 6 stages, fully editable). |
| **Checklist Template** | The default to-dos attached to a pipeline stage; cloned onto each application when it enters that stage. |
| **Application** | One student's submission: personal info, chosen profession, requested/confirmed dates, current stage, checklist progress, notes. |
| **Orientierungspraktikum** | An applicant's request to explore several related professions rather than commit to one. |
| **Pflichtpraktikum** | A school-mandated internship (vs. a voluntary one); tracked as a boolean on the application. |

## Product pillars for v1

1. Organization & branch setup (signup → create org → select professions → configure pipeline)
2. Team management (invite members, assign roles, optionally scope to a branch)
3. Public application intake (shareable link, embeddable on the company's site)
4. Application processing — pipeline board view
5. Application processing — calendar view (requested vs. confirmed vs. no date)

## What "done" looks like for MVP

A company can sign up, set up their org end-to-end, publish an apply link, receive real applications from that link, process them through a configurable pipeline with checklists and notes, and see their internship calendar — all without leaving Animo, and without ever seeing another organization's data.

## Non-goals for v1

- No applicant accounts/login
- No SSO
- No billing/payments
- No branch-specific pipeline customization (pipeline is org-wide)
- No native mobile app

See `product-requirements.md` for the full scope breakdown.

## Related documents

- `product-requirements.md` — MVP features and scope
- `user-flows.md` — step-by-step workflows
- `build-plan.md` — implementation phases and priorities
- `architecture.md` — technical architecture and technology choices
- `database-design.md` — entities, relationships, and migrations
- `api-design.md` — endpoints and request/response contracts
- `roles-and-permissions.md` — access control model
- `testing-strategy.md` — unit, integration, and end-to-end testing
- `deployment.md` — environments, CI/CD, and production setup
