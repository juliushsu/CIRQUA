# CIRQUA Restart Plan After Authoritative Reset

Generated: 2026-04-29

Authority sources:
- [CIRQUA_TRUE_SCHEMA_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_TRUE_SCHEMA_BASELINE.md)
- [CIRQUA_RESET_AUTHORITATIVE_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_RESET_AUTHORITATIVE_BASELINE.md)

Reset rule:
- this plan is valid only for CIRQUA project ref `pzidyucjmlivbwlbyckh`
- any Sprint logic not grounded in the two authority files above is out of scope
- Sprint `2G–2P` is treated as deprecated for CIRQUA unless re-proven with direct CIRQUA evidence

## 1. Trusted Baseline

### Supabase ref

- Supabase project ref: `pzidyucjmlivbwlbyckh`
- Project URL: `https://pzidyucjmlivbwlbyckh.supabase.co`

### Public tables

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

### RLS 狀態

- All verified `public` tables: `RLS disabled`
- All verified `public` tables: `force_rls = false`
- Verified `public` policies: `0`

### Existing `org_id` / `project_id` distribution

- `projects`
  - has `org_id`
  - does not have `project_id`
  - verified data issue: current live audit found `3` rows with `org_id is null`

- `org_members`
  - has `org_id`
  - does not have `project_id`

- `activity_logs`
  - no `org_id`
  - has `project_id`

- `alerts`
  - no `org_id`
  - has `project_id`

- `expense_categories`
  - no `org_id`
  - has `project_id`

- `expense_records`
  - no `org_id`
  - has `project_id`

- `forms`
  - no `org_id`
  - has `project_id`

- `income_categories`
  - no `org_id`
  - has `project_id`

- `income_records`
  - no `org_id`
  - has `project_id`

- `legal_documents`
  - no `org_id`
  - has `project_id`

- `project_members`
  - no `org_id`
  - has `project_id`

- `receipts`
  - no `org_id`
  - has `project_id`

- `organizations`
  - no `org_id`
  - no `project_id`

- `profiles`
  - no `org_id`
  - no `project_id`

### Existing RPC / functions

- `can_add_member(org_uuid uuid) -> boolean`
- `can_create_project(org_uuid uuid) -> boolean`
- `get_org_usage(org_uuid uuid) -> table(current_projects integer, current_members integer, current_storage_mb numeric)`
- `handle_new_user() -> trigger`

Operational meaning:
- CIRQUA is still in pre-hardening state
- `org_id` is not yet the canonical enforced tenant key across operational tables
- any future RLS design must start from `projects` and `org_members`, then extend to project-child tables

## 2. Deprecated Sprint Artifacts

### Sprint `2G–2P` presence in repo

- Repo evidence found for `Sprint 2G–2P`: `no`
- Matching files: `none`
- Matching commits: `none`

### Deprecated handling

- Should `Sprint 2G–2P` be marked deprecated for CIRQUA: `yes`
- Should `Sprint 2G–2P` be forbidden as a schema authority source: `yes`
- Should future CIRQUA reports cite `2G–2P` without re-verification against ref `pzidyucjmlivbwlbyckh`: `no`

### Required wording rule

Any mention of `Sprint 2G–2P` in future CIRQUA work must say one of:
- `deprecated for CIRQUA`
- `not present in CIRQUA repo`
- `not authoritative unless re-verified against pzidyucjmlivbwlbyckh`

## 3. New Sprint Plan

Restart point:
- `Sprint 1 verified baseline`
- then a new restart lane `R1–R5`

### Sprint R1: tenant key audit

Goal:
- confirm the real tenant anchor before any mutation

Scope:
- re-run live audit against CIRQUA ref `pzidyucjmlivbwlbyckh`
- verify row counts for `organizations`, `projects`, `org_members`, `project_members`
- verify all `projects.org_id` null cases
- classify each public table into:
  - tenant root
  - org-bound
  - project-child
  - special/global
- split verification SQL into:
  - baseline-safe queries
  - post-migration queries

Definition of done:
- no baseline query references non-existent child-table `org_id`
- a clean tenant map exists for every current public table

### Sprint R2: `projects` / `org_members` RLS design

Goal:
- design the first real security boundary on the only two tables already carrying `org_id`

Scope:
- define read/write/admin policy matrix for `projects`
- define read/write/admin policy matrix for `org_members`
- define how `organizations` is exposed:
  - self-org read only
  - admin-heavy writes only
- define whether `profiles` remains isolated from broad org reads
- design revoke strategy for `anon` and `authenticated`

Definition of done:
- policy design is grounded only in existing columns
- no policy text assumes child-table `org_id`

### Sprint R3: project-child tables RLS design

Goal:
- design how child tables move from `project_id`-only shape to tenant-safe access

Scope:
- decide exact migration order for adding child-table `org_id`
- define backfill source strictly from `projects.org_id`
- define orphan detection and rejection rules
- produce per-table RLS templates for:
  - `activity_logs`
  - `alerts`
  - `expense_categories`
  - `expense_records`
  - `forms`
  - `income_categories`
  - `income_records`
  - `legal_documents`
  - `project_members`
  - `receipts`

Definition of done:
- each child table has a migration-safe path from current state to org-scoped enforcement
- no RLS enablement is scheduled before backfill validation

### Sprint R4: controlled write path design

Goal:
- prevent accidental wide-open writes while RLS is being introduced

Scope:
- define which writes stay on direct Supabase table access
- define which writes move behind controlled RPC or backend path
- re-evaluate existing functions:
  - `can_add_member`
  - `can_create_project`
  - `get_org_usage`
  - `handle_new_user`
- define minimum grants for:
  - `anon`
  - `authenticated`
  - `service_role`

Definition of done:
- every write path has an explicit trust boundary
- no business RPC remains casually executable by `anon`

### Sprint R5: staging dry run

Goal:
- prove the new tenant and RLS model in a controlled environment before any production move

Scope:
- run migration sequence in staging only
- validate pre/post row counts
- test same-user / other-org read denial
- test same-org allowed access
- test project-child joins after backfill
- test rollback steps

Definition of done:
- staged dry run passes without unexplained orphans
- cross-tenant read is blocked in authenticated tests
- rollback instructions are proven

## 4. Project Boundary Guard

Every execution must start with this checklist.

### Repo path

- expected repo path: `/Users/chishenhsu/Desktop/Codex/CIRQUA`
- if current path does not end with `/CIRQUA`, stop

### Git remote

- expected remote: `https://github.com/juliushsu/CIRQUA.git`
- if remote differs, stop and re-verify project identity

### Supabase ref

- expected ref: `pzidyucjmlivbwlbyckh`
- if a report, env var, linked project file, or dashboard output shows another ref, stop

### Expected anchor tables

- `organizations`
- `org_members`
- `projects`
- `project_members`

If any of these anchor tables are missing from a claimed CIRQUA baseline, stop.

### Forbidden foreign-schema table names

If any proposed baseline or Sprint report introduces these without direct CIRQUA verification, stop and classify as foreign-schema contamination:

- `accounts`
- `workspaces`
- `workspace_members`
- `tenants`
- `tenant_members`
- `companies`
- `company_members`
- `portfolios`
- `portfolio_members`
- `sites`
- `assets`
- `asset_versions`
- `campaigns`
- `campaign_members`
- `knowledge_bases`
- `agents`
- `agent_runs`
- `threads`
- `messages`

Guard rule:
- these names are not proven CIRQUA baseline tables
- they may belong to another product line or imagined schema
- they must not enter CIRQUA planning without live DB evidence

## 5. CTO Go / No-Go

### 可繼續項目

- continue CIRQUA work only from the authority baseline
- continue tenant-key audit and RLS design
- continue migration planning for child-table `org_id`
- continue grant lockdown planning
- continue staging-only dry run preparation

### 禁止項目

- do not cite `Sprint 2G–2P` as CIRQUA truth
- do not assume child tables already have `org_id`
- do not enable RLS on child tables before backfill validation
- do not use `x-organization-id` header assumptions as proof of tenant isolation
- do not merge foreign schema names into CIRQUA planning without live evidence
- do not run production mutations before staging dry run succeeds

### 下一個應執行的 Sprint

- Next Sprint: `Sprint R1`

Decision:
- `Go` for `Sprint R1`
- `No-Go` for any work that skips the trusted baseline or revives deprecated `2G–2P` logic

