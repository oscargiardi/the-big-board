# Made For Platform — Delivery Roadmap

## Delivery principle

Design the shared architecture and permission model upfront, then deliver the product in small end-to-end releases. Do not wait until the whole platform is complete before testing it with real Made For work.

The first usable slice should prove the central proposition:

> A Made For team member updates one real project in the Big Board, publishes a client-safe revision, and the client sees it at a secure personal URL without anyone re-entering the information.

## Phase 0 — Discovery and service design

Indicative duration: 2–3 weeks.

### Work

- Walk through both prototypes with Mitch and representative staff.
- Observe the Monday ritual and current opportunity-to-project, project-to-invoice, weekly client update, document issue, variation, and tender workflows.
- Inventory HubSpot, Streamtime, Xero, Dropbox/document sources, spreadsheets, calendars, communication tools, and active automations.
- Confirm roles, sensitive fields, client visibility, approval meaning, working-day rules, lifecycle stages, fee stages, and office differences.
- Obtain representative source exports and profile migration quality.
- Agree success measures and name Made For’s product and Monday-ritual owners.

### Gate

Approve:

- Canonical workflows and terminology.
- System of record for each entity/field.
- Client visibility and permission matrix.
- Migration size and priorities.
- The single accounting writer into Xero.
- Streamtime API/subscription access.
- Whether Streamtime retirement proceeds now or after the shared platform launch.

## Phase 1 — Foundation and schema

Indicative duration: 3–4 weeks.

### Deliverables

- Next.js/TypeScript application and Made For design system.
- Development, staging, and production environments.
- Database schema for identity, organisations, opportunities, projects, stages, tasks, weekly issues, client progress, programme, financials, documents, tender, audit, and integrations.
- Staff and client authentication, MFA policy, invitations, role/project permissions, and row-level security.
- Private object storage and document-version upload pipeline.
- Append-only audit and transactional outbox patterns.
- Automated deployment, tests, monitoring, backups, and restore runbook.
- Wildcard project domain and staging-domain foundations.

### Acceptance

- Permission matrix tests pass for staff, accounts, client viewer, and client approver.
- A client cannot query another project or an internal-only field.
- Backup restoration and a versioned document upload are demonstrated.

## Phase 2 — End-to-end proof

Indicative duration: 2–3 weeks.

### Deliverables

- One real canonical project.
- Basic internal project update and milestone editing.
- Client-safe query/read model.
- Draft, preview, publish, history, and notification workflow.
- Secure personal project URL such as `pilot-project.projects.made-for.com.au`.
- Project-scoped client invitation and sign-in.

### Acceptance

- Made For updates once; the approved information appears in the client portal.
- Draft/internal information is absent from client responses.
- A published revision remains unchanged when later internal edits occur.
- The client can access only the invited pilot project.

This phase proves the highest-risk architectural boundary before either experience becomes feature-heavy.

## Phase 3 — Core Big Board

Indicative duration: 5–7 weeks.

### Deliverables

- Opportunities: structured intake, ownership, heat, value, forecast, archive, and won-project creation.
- Projects: lifecycle/fee-stage progression, milestones, ownership, team, stage ageing, remaining fee, and invoice-ready signals.
- Monday ritual: six questions, pre-filled prior commitments, confirm/update/flag, carry-over reasons, lead sign-off, and frozen issue.
- Tasks: personal Todoist-style focus, studio planning, inbox/this week/future, priorities, ordering, completion history, and 15-minute estimates.
- People and capacity: availability, leave/non-project time, project allocation, task demand, warnings, and transparent assumptions.
- Overview: office filters, priorities, stale data, stage movement, workload risks, and changes since the previous issue.
- Replace the current calendar page with useful project milestones, deadlines, and workload views unless testing identifies a stronger job for it.

### Acceptance

- Active opportunities/projects have an owner, stage, next date, and last-confirmed timestamp.
- A won opportunity creates a linked project without re-keying or losing source history.
- Monday issue can be completed, published, and compared with the prior week.
- Capacity values can be explained from named sources rather than demo heuristics.

## Phase 4 — Complete Client Project Tracker

Indicative duration: 5–7 weeks.

### Deliverables

- Project setup wizard using versioned templates; target setup under 15 minutes.
- Made For Team page from project memberships and approved contact information.
- Weekly Progress authoring, review, publication, notification, and history.
- Programme baseline/current dates, milestones, variance, movement reasons, and client timeline.
- Budget with configurable visibility, baseline, pending/approved variations, attachments, and immutable decisions.
- Document register with actual uploads, versions, stage/category, status, issue state, and secure downloads.
- Tender longlist/shortlist, responses, attached submissions, comparison, recommendation, and decision.
- “What changed since last visit,” print/PDF issue, archive, and retention flow.

### Acceptance

- Every issued document and approval points to an immutable version.
- No internal financial/capacity/pipeline data enters client responses.
- A second project can be provisioned from a template without code or deployment changes.

## Phase 5 — Integrations, migration, and administration

Indicative duration: 3–5 weeks, overlapping earlier work only where safe.

### Deliverables

- Repeatable HubSpot import for active pipeline and client data.
- Active project, team, fee-stage, and priority document migration.
- Xero contact mapping, invoice-ready workflow, designated draft-invoice writer, status reconciliation, idempotency, and errors.
- Optional Streamtime synchronization or export/import adapter.
- Administration for users, offices, roles, templates, heat probabilities, capacity thresholds, document categories, visibility defaults, and integration health.
- Import batches with dry runs, validation, exception reporting, reconciliation, source IDs, and rollback.

### Acceptance

- Commercial counts/totals reconcile to signed-off source exports.
- A failed or duplicate integration attempt cannot create duplicate invoices.
- Data freshness and sync failures are visible to administrators.

## Phase 6 — Pilot and staged launch

Indicative duration: 4–6 weeks.

### Rollout

1. Run the Big Board through real Monday cycles with a small cross-office group.
2. Run one live, low-risk client project through the portal.
3. Fix entry friction, unclear language, permission gaps, and notification noise.
4. Expand to both offices and two or three client projects.
5. Migrate remaining active projects.
6. Remove obsolete dual-entry workflows after acceptance.
7. Review adoption and system boundaries at 30 and 90 days.

### Acceptance

- At least 90% of required Monday updates are complete before issue publication by week four.
- New tracker setup takes under 15 minutes.
- Invoice-ready stages reach the designated accounting workflow within one business day.
- Concurrent Monday editing, failed-integration recovery, and backup restoration are demonstrated.
- Named Made For owners accept operations, support, and adoption responsibilities.

## Phase 7 — Optional Streamtime replacement

Indicative duration: approximately 8–12+ additional weeks.

Proceed only if Made For approves retirement after the shared platform has proven adoption.

### Additional capabilities

- Actual time entry separate from task estimates.
- Timesheet reminders, submission, approval, locking, correction, and audit.
- Effective-dated charge/cost rates with restricted access.
- Project budgets, planned versus actual time, WIP, write-offs, fee burn, billing schedules, and profitability.
- Leave/non-billable time required for trustworthy utilisation.
- Direct draft-invoice creation in Xero and financial-status reconciliation.
- Historical operational/financial migration.

### Decommissioning gate

- Parallel run against Streamtime for at least two billing cycles.
- Timesheet, WIP, invoice, and total reconciliation.
- Finance sign-off and controlled read-only/decommissioning period.

## Planning ranges

- Common platform while retaining Streamtime during rollout: approximately **18–26 weeks**.
- Including Streamtime replacement: approximately **26–38+ weeks**.

These are planning ranges, not fixed quotes. Team composition, workflow decisions, source-data quality, document volume, and Streamtime retirement scope can materially change them.

## Delivery governance

- Weekly delivery review and fortnightly working-product demonstration.
- Decision log for scope, terminology, policy, and system ownership.
- Acceptance criteria agreed before each phase begins.
- Real users and real projects in every pilot.
- Feature flags for client portals, financial exports, and major workflows.
- Role-based onboarding, short operating guides, technical/admin runbooks, and defined post-launch support.
