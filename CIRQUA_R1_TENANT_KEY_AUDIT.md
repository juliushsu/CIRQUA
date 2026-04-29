# CIRQUA R1 Tenant Key Audit

Generated: 2026-04-29

Authority sources:
- [CIRQUA_TRUE_SCHEMA_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_TRUE_SCHEMA_BASELINE.md)
- [CIRQUA_RESET_AUTHORITATIVE_BASELINE.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_RESET_AUTHORITATIVE_BASELINE.md)
- [CIRQUA_RESTART_PLAN_AFTER_RESET.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_RESTART_PLAN_AFTER_RESET.md)

Execution constraints honored:
- CIRQUA only
- project boundary guard executed first
- no Lumiere Nexus scope
- no migration applied
- no production mutation
- no deprecated `Sprint 2G–2P` logic used

## 1. Boundary Guard 結果

### Repo path

- Expected: `/Users/chishenhsu/Desktop/Codex/CIRQUA`
- Actual: `/Users/chishenhsu/Desktop/Codex/CIRQUA`
- Result: `pass`

### Git remote

- Expected: `https://github.com/juliushsu/CIRQUA.git`
- Actual: `https://github.com/juliushsu/CIRQUA.git`
- Result: `pass`

### Git branch state

- Current branch: `main`
- Working tree status during audit start: clean relative to `origin/main`
- Result: `pass`

### Supabase ref

- Expected: `pzidyucjmlivbwlbyckh`
- Verified from authority docs: `pzidyucjmlivbwlbyckh`
- Verified from linked project file: `pzidyucjmlivbwlbyckh`
- Result: `pass`

### Expected anchor tables

- Required anchor tables:
  - `organizations`
  - `org_members`
  - `projects`
  - `project_members`
- All four are present in the authoritative baseline
- Result: `pass`

### Forbidden foreign-schema names

- Check result:
  - no foreign-schema table name was found in authoritative baseline files as a real CIRQUA table
  - matches only appeared inside the guard list itself
- Result: `pass`

### Overall boundary guard

- Final result: `pass`
- Audit may proceed as CIRQUA R1

## 2. 14 張 Tables 的 `org_id` / `project_id` 狀態

| Table | `org_id` | `project_id` | Tenant-key observation |
| --- | --- | --- | --- |
| `activity_logs` | no | yes | project-scoped child table; tenant currently indirect via project |
| `alerts` | no | yes | project-scoped child table; tenant currently indirect via project |
| `expense_categories` | no | yes | project-scoped child table; tenant currently indirect via project |
| `expense_records` | no | yes | project-scoped child table; tenant currently indirect via project |
| `forms` | no | yes | project-scoped child table; tenant currently indirect via project |
| `income_categories` | no | yes | project-scoped child table; tenant currently indirect via project |
| `income_records` | no | yes | project-scoped child table; tenant currently indirect via project |
| `legal_documents` | no | yes | project-scoped child table; tenant currently indirect via project |
| `org_members` | yes | no | org-bound membership anchor |
| `organizations` | no | no | tenant root table |
| `profiles` | no | no | identity/system table with no tenant key yet |
| `project_members` | no | yes | project-scoped membership child; tenant currently indirect via project |
| `projects` | yes | no | org-bound project anchor; live audit found current `org_id` null backlog |
| `receipts` | no | yes | project-scoped child table; tenant currently indirect via project |

Key reading:
- only `projects` and `org_members` currently carry `org_id`
- `organizations` is the tenant root but does not itself need an `org_id`
- ten operational child tables still depend on `project_id` as indirect tenant linkage
- `profiles` is neither org-root nor project-child in the current schema

## 3. 哪些表是 org-root

### Org-root tables

- `organizations`
  - tenant root table
  - should remain the source tenant entity

### Org-bound anchor tables

- `org_members`
  - direct membership link from user to organization

- `projects`
  - direct project-to-organization anchor
  - already has `org_id`
  - current live data still has null `org_id` backlog that blocks safe downstream backfill

Operational note:
- CIRQUA should treat `organizations`, `org_members`, and `projects` as the core tenant boundary set for R2

## 4. 哪些表是 project-child

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

Shared property:
- each currently carries `project_id`
- none currently carries `org_id`
- each should be treated as a downstream child of `projects`

## 5. 哪些表是 system/reference

- `profiles`
  - global identity and sensitive profile data
  - not currently modeled as org-root or project-child
  - should not be treated as broadly tenant-readable by default

- `organizations`
  - tenant root, but also system-level reference for plan and subscription metadata
  - special handling is required because it is not a child row and does not carry parent tenant key

There are no standalone lookup/reference tables in the current 14-table baseline beyond this special handling set.

## 6. 哪些表需要補 `org_id`

These tables need direct `org_id` in the restart hardening path:

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

Reason:
- all ten are tenant-bound operational rows
- all ten already rely on `project_id`
- all ten should inherit tenant identity from `projects.org_id`
- adding direct `org_id` will make RLS, auditing, joins, and grant reduction safer and more explicit

Precondition:
- `projects.org_id` must be fully reconciled first
- no child-table backfill should happen while `projects.org_id` still has unresolved null rows

## 7. 哪些表不應補 `org_id`

### Should not add `org_id`

- `organizations`
  - already is the tenant root
  - adding `org_id` would be structurally wrong

- `org_members`
  - already has `org_id`
  - no additional tenant key is needed

- `projects`
  - already has `org_id`
  - task is data cleanup and enforcement, not another tenant column

- `profiles`
  - current baseline does not justify adding `org_id` yet
  - profile visibility should be solved by explicit access model, not by casually forcing a tenant key into the identity root

## 8. R2 建議範圍

R2 should stay narrow and only cover the tables that already support org-scoped design without inventing schema.

### Recommended R2 scope

- `organizations`
  - define self-org read model
  - define admin-heavy write model

- `org_members`
  - define select policy for same-org members
  - define owner/admin write policy

- `projects`
  - define select policy for same-org members
  - define owner/admin write policy
  - define handling for rows whose `org_id` is still null

- `profiles`
  - define explicit temporary isolation model
  - likely self-read and restricted privileged access only

- grants and RPC review for existing functions:
  - `can_add_member`
  - `can_create_project`
  - `get_org_usage`
  - `handle_new_user()`

### Recommended R2 exclusions

- do not enable child-table RLS yet
- do not assume child-table `org_id` exists
- do not backfill child tables in R2
- do not treat `x-organization-id` as a security boundary

### R2 outcome target

- finish a baseline-true policy design for `organizations`, `org_members`, `projects`, and `profiles`
- prepare the exact entry conditions for R3 child-table hardening

## 9. Final R1 Conclusion

Current CIRQUA tenant-key shape is simple and incomplete:
- tenant root: `organizations`
- direct org-bound anchors: `org_members`, `projects`
- project-child tables needing future `org_id`: `10`
- special identity table requiring separate access model: `profiles`

R1 judgment:
- `Go` for R2 design work on org-root and org-bound anchors
- `No-Go` for child-table RLS enablement until `projects.org_id` is fully reconciled
