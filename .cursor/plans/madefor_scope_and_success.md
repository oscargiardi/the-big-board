# Made For Platform — Product Scope and Success

## Product outcome

Build one Made For operating platform around a shared project record:

- **Internal Big Board:** pipeline, live projects, project stages, Monday updates, personal/studio tasks, capacity, forecasting, stage ageing, fee visibility, and invoice triggers.
- **Client Project Portals:** secure per-project views covering team, weekly progress, programme, client-safe budget and variations, documents, and tender.
- **Administration:** reusable project templates, users and roles, client access, studio settings, integrations, migration tools, audit, and operational health.

The aim is not merely to consolidate screens. It is to create the lowest-friction way for Made For to declare and maintain the truth about the studio every week.

## Internal Big Board scope

### Overview

- Studio and office filters.
- Live projects and opportunities.
- Hyper priorities and overdue Monday updates.
- Capacity risks and underuse.
- Stage ageing and stalled work.
- Invoice-ready stages.
- Changes since the prior issue.

### Opportunities

- Structured opportunity intake, client/source, owner, heat/confidence, value, expected close, and likely start.
- Weighted forecast with clearly visible assumptions.
- Won/lost lifecycle and archive.
- Won opportunity creates a linked canonical project without re-keying or losing source history.

### Projects

- Lifecycle and contracted fee-stage progression.
- Owner, team, milestones, next dates, stage duration, status, and client portal state.
- Fee schedule, remaining fee, fee-burn inputs, and invoice-ready signals.
- Internal risks, priorities, and notes excluded from client views.

### People and capacity

- Contracted availability and working calendars.
- Leave and non-project reservations.
- Project allocations and scheduled task demand.
- Overload/underuse warnings and explainable utilisation.
- Pipeline win-scenario modelling.

Capacity, task estimates, and project allocations remain separate concepts so demand is not double-counted.

### Personal and studio tasks

- Todoist-style personal focus view.
- Studio/lead planning view.
- Inbox, this week, future, due dates, priority, ordering, completion, and rollover.
- Estimates stored as minutes in 15-minute increments up to the configured working day.
- Personal lists are projections of assigned tasks, not copied tasks.

### Monday ritual

- Six structured questions.
- Prior-week commitments pre-filled for confirmation or exception.
- Confirm, update, or flag rather than re-entering everything.
- Rollover and defer reasons.
- Missing-update reminders and lead sign-off.
- Frozen Monday issue and comparison with prior weeks.

### Calendar replacement

Remove the current five-week calendar unless testing identifies a valuable job for it. Retain purposeful milestone, deadline, programme, and workload views within Projects, Tasks, Overview, and the client portal.

## Client Project Portal scope

### Setup and access

- Create from an existing canonical project using a versioned project template.
- Select client organisation, portal slug/domain, team, approvers, programme, visible budget fields, document categories, and branding.
- Target provisioning time under 15 minutes and no code/deployment work.
- Client viewer and client approver roles restricted to named projects.

### Made For Team

- Project members, roles, responsibilities, and approved contact details.

### Progress

- Draft generated from Monday updates, completed work, milestone movement, and outstanding items.
- Project-lead preview and publication.
- This week, next week, outstanding items, programme note, author, publication timestamp, notification, and immutable history.

### Programme

- Versioned baseline and current forecast dates.
- Phases, milestones, variance, dependencies where required, and movement reasons.
- Client-readable timeline and approved change history.

### Budget and variations

- Configurable client-visible budget headings and totals.
- Original baseline, pending variations, approved variations, current approved total, and attached evidence.
- Variation workflow: draft, submitted, approved/rejected, with comments, actor, timestamp, and immutable version.
- Internal Made For fees, costs, rates, and margin remain excluded unless specifically approved.

### Documents

- Real private uploads, logical documents, immutable versions, categories/stages, statuses, issue dates, and client visibility.
- Issued/approved statuses point to a specific version.
- Authorization-checked downloads and download audit where required.

### Tender

- Contractor longlist/shortlist, invitations where in scope, responses, document versions, comparison, recommendation, and decision history.
- Tender information treated as a stricter confidentiality boundary within the project.

### Client experience

- Personal URL such as `bain-capital.projects.made-for.com.au`.
- Made For/client co-branding.
- “What changed since last visit.”
- Email update digest and print/PDF issue.
- Project archive and retention after completion.

## Administration

- Users, organisations, offices, roles, invitations, and project memberships.
- Lifecycle and fee-stage templates.
- Project templates with version history.
- Heat probabilities and forecast assumptions.
- Capacity thresholds and working-day settings.
- Document categories, visibility defaults, approval rules, and retention.
- Integration connections, mappings, import batches, synchronization status, and failures.
- Project-level and cross-project audit search.

## Scenario boundaries

### Common platform

- Xero remains the accounting ledger.
- HubSpot pipeline is replaced.
- Made For owns the canonical opportunity/project model and client portals.
- Streamtime is retained during rollout until a separate retirement gate is accepted.

### Retain Streamtime

- Streamtime remains authoritative for actual time, WIP, operational invoicing, and selected finance reporting.
- Big Board owns planning, project truth, task estimates, capacity intent, and client publication.

### Replace Streamtime

- Add actual time, rates, timesheets, availability, WIP, write-offs, billing schedules, profitability, Xero draft-invoice creation, and finance reconciliation.
- This is an additional workstream, not implied by adding Todoist-style tasks.

## Explicitly outside v1 unless approved

- AI or a searchable “central brain.”
- Commercial multi-tenancy, SaaS billing, and self-service provisioning for other studios.
- Payroll.
- General CRM marketing automation.
- Email hosting.
- BIM/CAD authoring or drawing markup.
- Full critical-path construction scheduling.
- Native mobile applications.
- Offline-first operation.
- Unrestricted two-way synchronization.
- External tenderer portals or e-signature with independent legal assurance.

Clean organisation/template boundaries should avoid blocking future productisation, but v1 does not build a product for other studios.

## Proposed success measures

Agree baselines and exact targets during discovery:

- At least 90% of required Monday updates completed before issue publication by week four.
- 100% of active opportunities/projects have an owner, current stage, next key date, and last-confirmed timestamp.
- New client tracker provisioned in under 15 minutes without code changes.
- Stage completion creates an invoice-ready item immediately and reaches the designated accounting workflow within one business day.
- Capacity values are explainable from availability, allocations, and task estimates.
- No client can access another project or an internal-only field; isolation tests run on every deployment.
- Every variation approval and issued document resolves to a named actor, timestamp, and immutable version.
- Backup restoration, failed-integration recovery, and concurrent Monday editing are demonstrated before launch.
- A 90-day review shows sustained weekly use and provides evidence for the Streamtime retirement decision.

## Principal risks and controls

### Non-adoption

Control through confirm/update/flag interactions, pre-filled Monday reviews, visible staleness, personal value for every role, real-user pilots, and a named internal ritual owner.

### Client data leakage

Control through explicit client-safe queries/read models, server/database authorization, publication workflow, project membership, field/resource visibility, and exhaustive isolation tests.

### Data quality and migration

Control through representative source exports, dry-run imports, stable source mappings, exception reports, and reconciled counts/totals.

### Capacity and forecast mistrust

Keep availability, allocations, tasks, pipeline demand, and commercial forecast distinct. Display assumptions, overrides, source, and snapshot date.

### Approval ambiguity

Bind approvals to immutable versions and record requester, approver, decision, comments, and timestamps. Confirm legal significance during discovery.

### Xero duplication

Use one designated writer, stable idempotency, mapping tables, outbox processing, and reconciliation.

### Template drift

Version templates. Projects retain the version used at creation; later template changes do not silently rewrite active projects.

### Streamtime dependency

Treat Streamtime v2 as a beta integration, show data freshness, reconcile periodically, and retain export fallback. Do not promise real-time two-way synchronization.
