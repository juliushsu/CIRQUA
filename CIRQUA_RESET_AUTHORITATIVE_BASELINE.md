# CIRQUA RESET Authoritative Baseline Rebuild

Generated: 2026-04-29

Purpose:
- stop treating proposal-state schema as if it already exists
- freeze one authoritative CIRQUA baseline
- isolate any post-baseline drift from future work

Evidence used:
- [CIRQUA_TRUE_SCHEMA_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_TRUE_SCHEMA_BASELINE.md)
- [supabase/.temp/linked-project.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/.temp/linked-project.json)
- [sprint1-artifacts/supabase_sprint1_snapshot.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/sprint1-artifacts/supabase_sprint1_snapshot.json)
- [db-inventory/supabase-database-inventory.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/db-inventory/supabase-database-inventory.json)

## 1. Confirm True CIRQUA Supabase Project

- Supabase project ref: `pzidyucjmlivbwlbyckh`
- Project URL: `https://pzidyucjmlivbwlbyckh.supabase.co`
- Confirmed schema list: `public`
- Confirmed public tables:
  - `activity_logs`
  - `alerts`
  - `expense_categories`
  - `expense_records`
  - `forms`
  - `income_categories`
  - `income_records`
  - `legal_documents`
  - `org_members`
  - `organizations`
  - `profiles`
  - `project_members`
  - `projects`
  - `receipts`

Conclusion:
- this repo is linked to one real CIRQUA project only
- no live evidence of a second project, second business schema, or alternate domain model was found inside this repo

## 2. Rebuilt Authoritative Table List

Authoritative table/column/RLS/function baseline is recorded in:
- [CIRQUA_TRUE_SCHEMA_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_TRUE_SCHEMA_BASELINE.md)

Critical reset facts:
- only `projects` and `org_members` currently contain `org_id`
- all project-scoped operational tables still rely on `project_id`, not `org_id`
- all `public` tables had `RLS disabled` in the verified live audit
- `public` policies verified: `0`
- verified `public` functions / RPC entries: `4`

## 3. Compare With Sprint History

Important evidence boundary:
- Git history in this repo currently contains `Sprint 1` and `Sprint 2A`
- No repo evidence exists for `Sprint 2B ~ 2F`
- No repo evidence exists for `Sprint 2G ~ 2P`

### Fully aligned with true CIRQUA schema

- `Sprint 1` inventory and audit artifacts
  - they describe the live schema as it existed on 2026-04-28
  - they correctly show 14 `public` tables, 0 policies, and RLS disabled everywhere

### Partially incorrect or proposal-only

- `Sprint 2A` draft hardening artifacts
  - they are CIRQUA-targeted, but they describe a future migration path, not the current baseline
  - anything in `Sprint 2A` that assumes child tables already have `org_id` is not true for the live baseline
  - anything in `Sprint 2A` that queries `public.<table>.org_id` on child tables is baseline-incompatible until those columns are actually created

### Lumiere Nexus classification

- No file, commit, schema, or table in this repo explicitly matches a separate `Lumière Nexus` schema
- No `Sprint 2G ~ 2P` artifact exists here to prove CIRQUA ownership
- Therefore:
  - repo-proven `Lumière Nexus` artifacts found here: `none`
  - any external `Sprint 2G ~ 2P` logic should be treated as `non-authoritative to CIRQUA` unless re-imported with direct evidence

Operational reset rule:
- for CIRQUA, authority stops at `Sprint 1` live audit plus `Sprint 2A` draft intent
- all post-`2F` or unverified post-baseline logic should be treated as suspended until re-proven against `pzidyucjmlivbwlbyckh`

## 4. Contaminated Artifact Review

Classification rules:
- `safe`: matches the verified baseline or is a clearly labeled read-only / planning artifact
- `contaminated`: mixes baseline truth with future-state assumptions and must not be reused as schema truth
- `delete`: should be removed because it is misleading and not useful

### Migrations

- `safe` [supabase/migrations/20260428_sprint2a_tenant_backfill_prepare.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_tenant_backfill_prepare.sql)
  - clearly labeled draft
  - additive only
  - useful as future migration prep
  - not authoritative baseline

- `safe` [supabase/migrations/20260428_sprint2a_rls_policy_skeleton.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_rls_policy_skeleton.sql)
  - clearly comment-wrapped skeleton
  - useful as policy draft
  - not falsely presented as applied

- `safe` [supabase/migrations/20260428_sprint2a_grants_lockdown.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_grants_lockdown.sql)
  - clearly review-only
  - correctly describes exposure risk

- `contaminated` [supabase/migrations/20260428_sprint2a_verification_queries.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_verification_queries.sql)
  - section 6 queries `org_id` on child tables where baseline evidence shows the column does not yet exist
  - safe to keep only if quarantined as post-migration verification, not baseline verification

### Reports

- `safe` [CIRQUA_STABILIZATION_SPRINT1_P0_REPORT.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_STABILIZATION_SPRINT1_P0_REPORT.md)
  - most authoritative report in the repo
  - grounded in live audit evidence

- `safe` [ARCHITECTURE_AUDIT_V1.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/ARCHITECTURE_AUDIT_V1.md)
  - architecture-level reading remains consistent with the verified tables
  - should not be used as schema authority by itself

- `safe` [CTO_INTEGRATION_READINESS_V1.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CTO_INTEGRATION_READINESS_V1.md)
  - readiness framing is directionally consistent with the live audit
  - should not be read as proof that hardening already exists

- `contaminated` [CIRQUA_STABILIZATION_SPRINT2A_TENANT_RLS_DRAFT.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_STABILIZATION_SPRINT2A_TENANT_RLS_DRAFT.md)
  - accurate as a draft
  - contaminated if reused as current schema truth because it assumes imminent `org_id` expansion and future RLS shape

- `contaminated` [CIRQUA_STABILIZATION_PLAN_V1.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_STABILIZATION_PLAN_V1.md)
  - strong recovery plan
  - contaminated if treated as baseline schema documentation because much of it is target-state

- `contaminated` [CIRQUA_STABILIZATION_EXECUTION_PLAN_V1.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_STABILIZATION_EXECUTION_PLAN_V1.md)
  - execution plan is valid as planning
  - contaminated if treated as evidence of completed DB state

### SQL / Script Artifacts

- `safe` [supabase/queries/sprint1_readonly_audit.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/queries/sprint1_readonly_audit.sql)
  - matches live audit purpose

- `safe` [scripts/sprint1_p0_audit.js](/Users/chishenhsu/Desktop/Codex/CIRQUA/scripts/sprint1_p0_audit.js)
  - generated the authoritative Sprint 1 snapshot

- `safe` [scripts/db_inventory.js](/Users/chishenhsu/Desktop/Codex/CIRQUA/scripts/db_inventory.js)
  - inventory logic is fine
  - note: REST fallback cannot prove RLS/policies

- `contaminated` [sprint2-artifacts/project_org_mapping_draft.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/sprint2-artifacts/project_org_mapping_draft.json)
  - useful as review aid
  - not authoritative business truth
  - must not be auto-applied

### Delete candidates

- `delete`: none in current repo

Recommendation:
- do not delete these drafts yet
- quarantine `contaminated` files conceptually as `proposal-state`, not `baseline-state`

## 5. Recovery Plan

### Where CIRQUA should restart

Restart from:
- `Sprint 1` verified live baseline
- then re-enter `Sprint 2A` as the first legitimate hardening sprint

Do not restart from:
- any imagined `2G ~ 2P` sequence
- any document that assumes `org_id` has already been propagated
- any verification SQL that expects child-table `org_id` before the migration exists

Practical next sprint:
1. Freeze [CIRQUA_TRUE_SCHEMA_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_TRUE_SCHEMA_BASELINE.md) as the only schema authority.
2. Rename or folder-isolate proposal-state artifacts under a clear `draft` or `proposed` lane.
3. Rework `20260428_sprint2a_verification_queries.sql` into:
   - `baseline_readonly_verification.sql`
   - `post_migration_verification.sql`
4. Re-run a fresh live audit before any schema mutation.
5. Only then apply the first real CIRQUA hardening migration.

### Lumiere Nexus repo / branch rule

- If `Lumière Nexus` is a separate product or schema line, it should live in a separate repo by default.
- If shared infra forces co-location, use a separate branch plus separate project ref documentation at minimum.
- Never let CIRQUA and Lumiere share one unnamed baseline document.

Recommendation:
- preferred: separate repo
- acceptable fallback: separate branch with its own `*_TRUE_SCHEMA_BASELINE.md`

### Forced checks to prevent mixing again

Before any Sprint starts, require all five checks:

1. Project ref lock
   - every report must print the exact Supabase ref
   - current CIRQUA ref: `pzidyucjmlivbwlbyckh`

2. Authority source lock
   - every schema report must say whether it came from:
     - live Postgres catalog
     - Supabase Management API
     - REST/OpenAPI fallback
   - no mixed undocumented source allowed

3. Baseline diff gate
   - no migration or sprint report may claim a column/table exists unless it appears in a fresh baseline diff

4. Proposal labeling gate
   - every draft migration and forward-looking report must include `draft`, `proposed`, or `not applied`

5. Repo lint gate
   - CI should fail if a report references a different project ref or a non-existent baseline table/column without explicitly labeling it as proposal-state

## 6. Final Reset Decision

Authoritative CIRQUA baseline:
- project ref `pzidyucjmlivbwlbyckh`
- schema `public`
- 14 business tables
- 0 verified `public` policies
- RLS disabled on every verified `public` table

Reset directive:
- CIRQUA resumes from `Sprint 1 verified baseline -> Sprint 2A hardening`
- all unverified post-`2F` logic is suspended for CIRQUA
- no proposal-state artifact may be cited as current schema truth again
