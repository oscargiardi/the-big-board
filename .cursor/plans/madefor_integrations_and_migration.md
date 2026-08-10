# Made For Platform — Integrations and Migration

## System ownership principle

Every entity and important field has one authoritative owner. Other systems may receive a copy or return status, but two systems must not independently write the same fact.

Proposed target:

- **Made For platform:** opportunities, projects, stages, team, weekly planning, tasks, capacity intent, client publication, programme, documents, variations, and tender.
- **Xero:** accounting contacts, tax, approved accounting documents, payments, credits, and bank reconciliation.
- **Streamtime retained scenario:** actual time, WIP, operational invoicing, and selected financial reporting remain authoritative in Streamtime.
- **Streamtime replacement scenario:** Made For adds actual time, WIP, rates, billing preparation, and profitability; Xero remains accounting authority.

Imported records carry source system, source ID, last-synced timestamp, provenance, and synchronization status.

## Integration architecture

- Integration connections and credentials are encrypted and restricted to administrators.
- Application writes create transactional outbox events in the same database transaction.
- Background workers process events with stable idempotency keys, retry policies, dead-letter handling, and correlation IDs.
- Incoming webhooks are verified, acknowledged quickly, queued, and followed by an authoritative resource fetch.
- Incremental synchronization is supplemented by periodic full reconciliation.
- Administrative screens expose data freshness, mappings, failures, retries, and unresolved exceptions.

## Xero boundary

Xero remains authoritative for accounting and reconciliation in every scenario.

### Common requirements

- Map Made For client/project IDs to Xero `ContactID` and accounting references.
- Do not treat contact names as unique identifiers.
- A completed billable stage creates an internal invoice-ready item.
- Accounts reviews the proposed client, amount, fee stage, tax/account mapping, description, and supporting context.
- The designated writer creates a **draft** Xero invoice.
- Approval, sending, tax, payment, credit, and bank reconciliation remain in Xero.
- Mirror invoice/payment status back into Made For; never infer that an invoice is paid merely because it was exported.
- Use stable idempotency keys so retries cannot create duplicate contacts or invoices.
- Process supported invoice/contact/credit-note webhooks and poll payment status because payments do not have a dedicated webhook category.
- Respect per-tenant concurrency/rate limits and implement exponential backoff using Xero’s limit headers.
- Xero permits only two active tracking categories. Prefer durable local mappings and project codes in invoice references rather than creating one category per project.

### Scenario A — Made For replaces Streamtime

- Made For is the single operational writer of draft Xero invoices.
- Use standard OAuth with rotating refresh tokens or an eligible paid Custom Connection for the single Xero organisation.
- An outbox worker creates draft invoices after accounts approval.
- Xero invoice/contact/credit-note webhooks and payment polling return financial status.
- Made For may optionally mirror projects/tasks/time to Xero Projects for reporting, but Xero Projects must not become the operational planning model.

### Scenario B — Streamtime remains

- Keep Streamtime’s native Xero integration as the sole writer for invoices and related accounting documents.
- Made For may read Xero financial status but must not also create Xero invoices.
- Maintain Made For–Streamtime–Xero mappings and reconcile invoice total, currency, status, amount paid, voids, and credits.

Relevant Xero documentation:

- [OAuth and custom connections](https://developer.xero.com/documentation/guides/oauth2/custom-connections/)
- [OAuth token lifecycle](https://developer.xero.com/documentation/guides/oauth2/token-types/)
- [Granular scopes](https://developer.xero.com/documentation/guides/oauth2/scopes/)
- [Webhooks](https://developer.xero.com/documentation/guides/webhooks/overview/)
- [Contacts API](https://developer.xero.com/documentation/api/accounting/contacts)
- [Invoices API](https://developer.xero.com/documentation/api/accounting/invoices)
- [Rate limits](https://developer.xero.com/documentation/guides/oauth2/limits/)

## Streamtime retained scenario

Streamtime API v2 can provide jobs, phases/items, assignments, planned minutes, timesheets, financial summaries, existing invoices, and reporting.

Constraints:

- API v2 is currently beta.
- API v1 is scheduled for deprecation near the end of 2026.
- No generic public webhook registration is documented.
- No v2 route for creating invoices is documented.
- Budgets are only partly writable through job/item structures.

Recommended design:

1. Confirm Made For’s subscription/API-key access during discovery.
2. Use v2 incremental polling for jobs, plans, assignments, time, budgets, and invoice status required by Big Board.
3. Run scheduled full reconciliation to detect missed or changed records.
4. Use CSV/PDF exports as a fallback and for migration evidence.
5. Treat optional Zapier triggers only as latency aids, not a complete event log.
6. Display last-synced time and stale/error state in the Big Board.
7. Avoid two-way synchronization. Assign ownership at entity/field level.

Relevant Streamtime documentation:

- [Public API guide](https://help.streamtime.net/en/articles/12854233-using-the-streamtime-public-api)
- [API v2 beta](https://help.streamtime.net/en/articles/13210543-using-the-streamtime-api-v2-beta)
- [v2 OpenAPI specification](https://api.streamtime.net/v2/swagger.json)
- [Data exports](https://help.streamtime.net/en/articles/11481617-exporting-data-and-documents)
- [Native Xero integration](https://help.streamtime.net/en/articles/895446-streamtime-and-xero)

## Streamtime replacement scope

Task lists and task estimates are not a Streamtime replacement. Retiring Streamtime also requires:

- Actual-time entry distinct from estimated effort.
- Timesheet submission, reminders, approvals, locking, corrections, and audit.
- Person charge/cost rates with effective dates and restricted visibility.
- Leave, holidays, contracted availability, and non-billable categories.
- Project budgets, planned versus actual time, WIP, fee burn, write-offs, billing schedules, and profitability.
- Invoice preparation, Xero draft creation, status feedback, and reconciliation.
- Historical migration and finance reports.

Run both systems for at least two complete billing cycles and retire Streamtime only after finance signs off reconciled time, WIP, invoices, and totals.

## Migration plan

### Discovery

- Inventory HubSpot, Streamtime, Dropbox/document sources, spreadsheets, and any other active systems.
- Obtain representative exports before final migration sizing.
- Measure record counts, required history, duplicates, missing owners/dates, inconsistent stages, document volume, and financial mismatches.
- Decide what should be imported, linked as read-only history, or left archived.

### Mapping

- Map source IDs to stable Made For IDs.
- Map clients/prospects, users, offices, opportunities, projects, stages, milestones, fee stages, tasks, documents, and accounting references.
- Preserve original creation timestamps and source references.
- Mark migrated audit/history as imported; do not manufacture user events for pre-platform actions.

### Repeatable imports

- Build versioned import batches rather than one-off database scripts.
- Validate required fields and referential integrity.
- Provide dry-run counts, totals, warnings, and exception reports.
- Make imports idempotent so they can be rehearsed safely.
- Reconcile by record counts, commercial totals, source IDs, and document checksums.
- Retain rollback/archive evidence for each batch.

### Migration priority

1. Users, offices, roles, and active client organisations.
2. Active opportunities.
3. Live projects, owners, teams, stages, dates, and fee schedules.
4. Open tasks and current allocations.
5. Current client progress, programme, budgets, variations, tender, and priority documents.
6. High-value recent history.
7. Historical closed work only where business value justifies migration.

### Cutover

- Pilot imports in staging with anonymised or approved fixtures.
- Rehearse the final active-data migration.
- Agree a short source-system freeze/cutover window.
- Run final reconciliation and business-owner sign-off.
- Keep legacy tools read-only for an agreed period.
- Remove duplicate-entry workflows after the replacement area is accepted.

## Integration and migration acceptance

- Imported counts and commercial totals match signed-off source reports.
- Every imported record can be traced back to its source ID/batch.
- Duplicate job/contact/invoice creation is prevented under retries.
- Integration health and stale data are visible.
- Failed jobs can be retried safely.
- Xero remains authoritative for accounting and payments.
- Streamtime is not decommissioned before billing-cycle reconciliation and finance approval.
