# CIRQUA STABILIZATION EXECUTION PLAN v1

Audit date: 2026-04-28

Goal:
- Convert `CIRQUA_STABILIZATION_PLAN_V1.md` into executable engineering work
- Enable Readdy and Codex to work in parallel without ownership conflicts
- Raise CIRQUA toward `>= 70 / 100` readiness with the smallest safe change set

Execution principle:
- Codex owns data model, security model, migration, and backend contract hardening
- Readdy owns UI, UX flow, and safe API integration updates
- No hidden schema changes outside migrations
- No UI workflow rewrites during DB hardening unless integration-safe adjustments are required

## 1. Sprint 規劃（2–3 週）

### Sprint 1（Week 1）

Goal:
- unblock infrastructure audit
- restore Supabase and Railway access
- make Supabase fully auditable

Scope:
- fix Postgres connection path
- fix Railway staging auth
- export metadata for RLS / grants / triggers / functions
- create migration workspace in repo
- define role matrix and audit checklist

Definition of Done:
- `psql` can connect using the approved audit connection
- Railway staging token can run `whoami`, `list`, and `status`
- RLS status, policies, triggers, grants, and RPC ownership are exported and reviewed
- `supabase/migrations` or equivalent migration folder exists in Git
- CTO can review a complete security metadata snapshot

### Sprint 2（Week 2）

Goal:
- harden tenant isolation
- roll out RLS across tenant-bound tables

Scope:
- add `org_id` to tenant-bound operational tables
- backfill `org_id` from `projects`
- add foreign keys and indexes
- enable RLS and apply baseline policies
- validate tenant isolation in staging with test users

Definition of Done:
- all tenant-bound tables have canonical `org_id`
- backfill completed with zero unexplained orphan rows
- FK validation passes
- RLS enabled on all tenant-bound tables
- authenticated users cannot cross-read another org in staging tests

### Sprint 3（Week 3, optional）

Goal:
- converge API contract
- separate environment behavior safely

Scope:
- formalize auth and tenant context contract
- move non-DB orchestration responsibilities to Railway boundaries
- add frontend env guardrails
- ensure staging and production routing separation

Definition of Done:
- API rules for auth and tenant context are documented and applied
- preview/staging cannot hit production write targets
- `VITE_API_BASE_URL` and allowed domains are environment-safe
- privileged workflows are clearly assigned to Railway or deferred with an explicit backlog entry

## 2. Task Breakdown（工程任務拆解）

### Backend（Supabase / Railway）

| Task | Impact scope | Breaking change | Migration needed | Estimate |
| --- | --- | --- | --- | --- |
| Restore Supabase admin audit access | audit, backend ops | no | no | 4h |
| Restore Railway staging token and project link | staging deploy visibility | no | no | 3h |
| Export RPC ownership, grants, triggers, and policy metadata | backend security review | no | no | 4h |
| Define backend auth contract for REST / RPC / Railway | API contract | low | no | 5h |
| Classify which workflows stay in Supabase vs Railway | architecture boundary | no | no | 4h |
| Add Railway-side privileged workflow placeholders or contract stubs | future integration lane | low | no | 6h |
| Add admin audit logging contract | privileged operations | low | yes | 6h |

### Database（schema / migration / RLS）

| Task | Impact scope | Breaking change | Migration needed | Estimate |
| --- | --- | --- | --- | --- |
| Add migration framework and baseline schema docs | repo traceability | no | yes | 4h |
| Add nullable `org_id` to 10 tenant-bound tables | schema, tenant model | low | yes | 6h |
| Create backfill script from `projects.org_id` to child tables | data correctness | no | yes | 6h |
| Audit and clean orphan / null tenant rows | live data quality | medium | yes | 8h |
| Add tenant indexes on `org_id`, `project_id` | performance, RLS | low | yes | 4h |
| Add FK constraints in phased mode | schema integrity | medium | yes | 8h |
| Enable RLS on tenant-bound tables | security boundary | high | yes | 6h |
| Implement standard read/write/admin policies | security boundary | high | yes | 10h |
| Add `admin_access_audit_logs` table | privileged access audit | low | yes | 4h |
| Tighten grants for `anon` / `authenticated` | auth security | medium | yes | 4h |
| Enforce `NOT NULL` after successful backfill | data integrity | medium | yes | 5h |

### Frontend（必要調整）

| Task | Impact scope | Breaking change | Migration needed | Estimate |
| --- | --- | --- | --- | --- |
| Normalize Authorization header usage on all API calls | auth consistency | low | no | 4h |
| Add active org session/context handling in client state | tenant-safe UX | low | no | 6h |
| Remove reliance on raw cross-tenant query assumptions | data access behavior | medium | no | 6h |
| Support optional `x-organization-id` as hint only | integration compatibility | low | no | 3h |
| Add UI guardrails for auth/session expiry and access denied flows | UX resilience | no | no | 5h |
| Add environment banner / runtime target display for staging | deploy safety | no | no | 3h |

### DevOps（env / deploy）

| Task | Impact scope | Breaking change | Migration needed | Estimate |
| --- | --- | --- | --- | --- |
| Inventory env var names across Supabase / Railway / frontend | ops visibility | no | no | 3h |
| Separate staging and production credentials | deploy safety | medium | no | 5h |
| Add environment allowlist rules for API base URLs | preview safety | low | no | 4h |
| Document release path staging -> production | deployment process | no | no | 3h |
| Add staging verification checklist to release process | release quality | no | no | 3h |
| Add CI or scripted validation for env mismatch | deployment safety | low | no | 5h |

## 3. Migration Strategy（超關鍵）

### Migration 順序

1. Create baseline migration structure
2. Add non-breaking columns:
   - add nullable `org_id`
   - add supporting indexes
3. Add backfill script
4. Run data audit queries
5. Clean bad rows and reconcile orphans
6. Add FK constraints in phased mode
7. Enable RLS and policies
8. Tighten grants
9. Enforce `NOT NULL`
10. Remove temporary compatibility logic if any

### 是否需要 backfill script

Yes.

Backfill is required for:
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

Backfill source:
- derive `org_id` from `projects.org_id` using each row's `project_id`

### 是否需要 data cleanup

Yes.

Required cleanup targets:
- rows with missing `project_id` where tenant scope is mandatory
- rows whose `project_id` does not resolve to a valid `projects.id`
- inconsistent category references
- orphan membership rows
- duplicate or malformed org/project membership states

### 如何避免 production data 破壞

Required controls:
- run every migration in staging first
- take pre-migration snapshot/backup
- run dry-run audit queries before mutating data
- separate schema-change migration from data-backfill migration
- validate row counts before and after backfill
- use phased constraints:
  - add column
  - backfill
  - validate
  - enforce `NOT NULL`
- never combine RLS enablement with unrelated schema rewrites in the same release

Recommended rollout style:
- one migration PR for schema prep
- one migration PR for backfill and validation
- one migration PR for RLS/grants tightening

## 4. Readdy / Codex 分工（避免 AI 打架）

### Codex 負責

- schema design and canonical tenant model
- migration files and migration ordering
- backfill scripts
- FK / index / `NOT NULL` hardening
- RLS enablement and policy design
- grants / privileges tightening
- REST / RPC / Railway API contract definition
- audit logging schema
- security verification scripts and staging test checklist

### Readdy 負責

- UI updates for active organization handling
- API integration updates against approved backend contract
- forms and UX flow adjustments caused by auth/tenant hardening
- error states for access denied / expired session / invalid environment
- staging/production environment indicators in UI
- client-safe handling for optional `x-organization-id`

### 禁止事項

- Readdy 不可直接改 DB schema
- Readdy 不可新增或修改 migration
- Readdy 不可直接改 RLS / grants / SQL policies
- Codex 不可直接改 UI flow
- Codex 不可任意變更產品表單文案或 UX 導航邏輯
- 雙方都不可直接在 production 手動修資料，必須經 migration / script / approved runbook

### 並行協作原則

- Codex publishes migration and API contract first
- Readdy only integrates against committed contract artifacts
- Any contract change requires:
  - updated migration/API doc
  - explicit changelog note
  - staging verification before UI merge

## 5. Risk Control（風險控制）

### 哪些任務可能造成資料錯誤

- `org_id` backfill
- FK constraint rollout
- `NOT NULL` enforcement
- RLS enablement
- grants tightening
- category / receipt / project orphan cleanup

### Rollback strategy

- take DB backup before each migration batch
- tag each release candidate before deployment
- separate rollback units:
  - schema prep rollback
  - backfill rollback
  - RLS/grant rollback
- keep compatibility window:
  - do not drop legacy assumptions immediately after adding `org_id`
- if RLS causes blocking regressions:
  - rollback to prior policy set
  - preserve audit logs
  - hotfix in staging before production retry

### Staging 驗證流程

1. Apply migration to staging
2. Run metadata verification:
   - RLS enabled flags
   - policies
   - grants
   - FKs
3. Run backfill validation queries
4. Test with at least:
   - Org A member
   - Org A admin
   - Org B member
   - internal admin if applicable
5. Verify:
   - no cross-org read
   - no cross-org write
   - allowed admin actions still work
6. Verify frontend flows against staging target
7. Only after written signoff proceed to production rollout

## 6. Verification Checklist（驗收清單）

CTO acceptance should verify:

- RLS is enabled on every tenant-bound table
- every tenant-bound row resolves to a valid `org_id`
- `anon` cannot write operational data
- authenticated APIs require auth
- cross-org reads are blocked for normal users
- org admins cannot silently access another org
- privileged cross-org access, if present, is audited
- staging uses separate credentials from production
- preview cannot hit production write targets
- migration history exists in Git and matches deployed schema
- Railway and Supabase environment names are documented
- frontend clearly indicates non-production environment

## 7. Release Plan

### Staging release 流程

1. Merge approved migration PR
2. Deploy schema prep to staging
3. Run backfill and validation
4. Apply RLS/grants changes
5. Deploy frontend and Railway contract-aligned changes
6. Execute staging verification checklist
7. Freeze changes and collect signoff

### Production rollout 條件

- staging verification completed without unresolved blockers
- backup/snapshot completed
- CTO or designated owner signs off on:
  - tenant isolation
  - auth requirements
  - environment separation
  - rollback plan
- release window selected with owner on standby

### 是否需要 feature flag

Yes, recommended for:
- new Railway-orchestrated privileged workflows
- any UI behavior that depends on new org-context handling
- progressive activation of admin-only tools

Not strictly needed for:
- pure schema prep migrations that are backward compatible

Recommended flags:
- `tenant_context_enforced`
- `railway_privileged_workflows_enabled`
- `cross_org_admin_audit_enforced`

## 預估總工時

Estimated total:
- Backend: `32h`
- Database: `71h`
- Frontend: `27h`
- DevOps: `23h`

Total estimated effort:
- `153h`

Practical planning range:
- `140h–170h` depending on data cleanup complexity and hidden environment issues

## 建議執行順序

1. Restore Supabase and Railway audit access
2. Create migration framework and export current metadata
3. Freeze API/schema contract for Sprint 2 work
4. Add `org_id` columns and backfill in staging
5. Add constraints, indexes, and cleanup scripts
6. Enable RLS and tighten grants
7. Update frontend integration against finalized contract
8. Separate environment routing and deploy guardrails
9. Complete staging verification and signoff
10. Roll out to production in phased release
