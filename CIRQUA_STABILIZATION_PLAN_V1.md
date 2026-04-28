# CIRQUA STABILIZATION PLAN v1

Audit date: 2026-04-28

Goal:
- Raise CIRQUA from readiness `32 / 100` to `>= 70 / 100`
- Make the platform safe enough for multi-system integration across Readdy / Codex / Supabase / Railway
- Prefer minimal, non-destructive hardening over rewrite-heavy changes

Target outcome:
- Direct infrastructure access is restorable and testable
- Tenant isolation is explicit and auditable
- API contract is normalized
- Staging and production are clearly separated
- DB/schema changes become traceable through migrations

## 1. P0 Critical Fixes

### 1.1 Postgres 無法連線的修復方案（Supabase connection）

Recommended repair path:

1. Re-copy the current database connection strings from Supabase dashboard
   - verify direct connection host
   - verify pooler connection host
   - verify port and SSL mode
2. Prefer validating three connection modes in order
   - direct Postgres host
   - transaction pooler
   - session pooler
3. Create a read-only audit credential if possible
   - avoid using broad service credentials for normal catalog inspection
4. Confirm whether the current project has network restrictions
   - IP allowlist
   - region restrictions
   - temporarily disabled direct DB access
5. Store only the env var name in repo documentation
   - never commit live DSNs or passwords

Likely root cause:
- stale connection string copied from an old Supabase UI or legacy host format

### 1.2 Railway Unauthorized 的修復方案

Recommended repair path:

1. Regenerate a fresh staging token from the Railway account that owns the staging project
2. Immediately validate:
   - `railway whoami`
   - `railway list`
   - `railway status`
3. Link the correct project and environment locally
4. Export service inventory:
   - services
   - domains
   - variables names only
   - recent deployments
5. If token scope is intentionally limited, create a dedicated audit token with read permissions for staging metadata

Likely root cause:
- revoked or stale token, or token created under a principal without project access

### 1.3 如何驗證修復成功（具體測試方法）

Supabase success checks:

```bash
psql "$DATABASE_URL" -c "select now(), current_database(), current_user;"
```

```bash
psql "$DATABASE_URL" -c "select count(*) from pg_policies;"
```

```bash
psql "$DATABASE_URL" -c "select table_name, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relkind='r';"
```

Railway success checks:

```bash
railway whoami
railway list
railway status
```

```bash
railway variables
railway domain
```

Definition of done:
- Supabase catalog queries return successfully
- Railway token can read the intended staging project
- staging services, domains, and env names are documented
- both checks are reproducible by another engineer

## 2. Tenant Isolation Hardening

### 2.1 補齊 `organization_id` 的建議

Canonical tenant key:
- Use only one canonical tenant key: `org_id`

Tables that already have direct tenant key:
- `projects`
- `org_members`

Tables that should add `org_id`:
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

Tables that should remain special:
- `organizations`
  - root tenant table, no parent tenant key needed
- `profiles`
  - global identity table, but must never be treated as globally readable operational data

Recommended approach:
- Add nullable `org_id` first
- Backfill via join from `projects`
- Validate row counts and orphans
- Then enforce `NOT NULL` on tables that are always tenant-bound

### 2.2 哪些應強制 `NOT NULL`

Should become `NOT NULL` after backfill:
- `projects.org_id`
- `org_members.org_id`
- `activity_logs.org_id`
- `alerts.org_id`
- `expense_categories.org_id`
- `expense_records.org_id`
- `forms.org_id`
- `income_categories.org_id`
- `income_records.org_id`
- `legal_documents.org_id`
- `project_members.org_id`
- `receipts.org_id`

Should remain nullable or case-dependent:
- `profiles`: no `org_id` on the profile root unless product intentionally chooses single-org profiles
- legacy `project_id` fields that currently appear nullable in some tables should be reviewed case by case before tightening

### 2.3 哪些應加入 FK constraint

High-priority FK constraints:
- `projects.org_id -> organizations.id`
- `org_members.org_id -> organizations.id`
- `org_members.user_id -> profiles.id`
- `project_members.project_id -> projects.id`
- `project_members.user_id -> profiles.id`
- `project_members.org_id -> organizations.id`
- `income_categories.project_id -> projects.id`
- `income_categories.org_id -> organizations.id`
- `expense_categories.project_id -> projects.id`
- `expense_categories.org_id -> organizations.id`
- `income_records.project_id -> projects.id`
- `income_records.category_id -> income_categories.id`
- `income_records.created_by -> profiles.id`
- `income_records.org_id -> organizations.id`
- `expense_records.project_id -> projects.id`
- `expense_records.category_id -> expense_categories.id`
- `expense_records.receipt_id -> receipts.id`
- `expense_records.created_by -> profiles.id`
- `expense_records.org_id -> organizations.id`
- `receipts.project_id -> projects.id`
- `receipts.uploaded_by -> profiles.id`
- `receipts.org_id -> organizations.id`
- `forms.project_id -> projects.id`
- `forms.created_by -> profiles.id`
- `forms.org_id -> organizations.id`
- `activity_logs.project_id -> projects.id`
- `activity_logs.user_id -> profiles.id`
- `activity_logs.org_id -> organizations.id`
- `legal_documents.project_id -> projects.id`
- `legal_documents.uploaded_by -> profiles.id`
- `legal_documents.org_id -> organizations.id`
- `alerts.project_id -> projects.id`
- `alerts.org_id -> organizations.id`

### 2.4 建議 canonical tenant model

Recommended model:
- Tenant root: `organizations.id`
- User membership root: `org_members`
- Project scope: `projects.id` with required `projects.org_id`
- All operational rows:
  - must carry `org_id`
  - may also carry `project_id` when tied to a project

Rule:
- `org_id` is the only canonical tenant key
- `project_id` is a business scope key, not the primary tenant boundary

## 3. RLS 強制策略設計

### 3.1 標準 RLS policy 模板

Recommended helper assumptions:
- JWT/session exposes `auth.uid()`
- Org membership is determined by `org_members`
- Org admin status is stored in `org_members.org_role`
- Cross-org admin access should be restricted to audited internal roles only

Read policy template:

```sql
create policy "<table>_select_org_member"
on public.<table>
for select
to authenticated
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = <table>.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
  )
);
```

Write policy template:

```sql
create policy "<table>_write_org_member"
on public.<table>
for all
to authenticated
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = <table>.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = <table>.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
  )
);
```

Admin policy template:

```sql
create policy "<table>_admin_org_admin"
on public.<table>
for all
to authenticated
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = <table>.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
      and om.org_role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = <table>.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
      and om.org_role in ('owner', 'admin')
  )
);
```

### 3.2 如何確保 user 只能看到自己 org

Required measures:
- Every tenant-bound table has `org_id`
- RLS `using` clause always compares row `org_id` to active memberships of `auth.uid()`
- No client query is trusted as the security boundary
- `anon` role has no access except explicitly public resources
- Joins in views/RPCs must preserve org filter semantics

### 3.3 admin 可跨 org（但需 audit）

Recommended design:
- Do not let ordinary org admins cross org
- Create a separate internal platform-admin role, distinct from tenant admin
- Cross-org access should require:
  - dedicated internal role
  - explicit RLS bypass path only for audited admin tools
  - immutable audit logging

Recommended controls:
- log actor user id
- log target org id
- log action type
- log table or endpoint
- log reason / ticket reference
- log timestamp

### 3.4 是否需要 audit log table

Yes, strongly recommended.

Add a dedicated table such as `admin_access_audit_logs` for:
- cross-org reads
- cross-org writes
- privileged RPC execution
- role changes
- membership changes
- sensitive profile access

Suggested columns:
- `id`
- `actor_user_id`
- `actor_role`
- `target_org_id`
- `target_table`
- `target_record_id`
- `action`
- `reason`
- `request_id`
- `created_at`

## 4. API Contract 統一規範

### 4.1 所有 API 必須遵守的規則

Required:
- `Authorization: Bearer <token>` on all authenticated calls
- tenant identity should come from session + DB membership, not from a trusted client header alone

Recommendation on `x-organization-id`:
- Do not use it as the primary security boundary
- It may be kept as an optional routing/context hint for UI convenience, logging, or analytics
- If kept:
  - backend must validate it against the authenticated user session
  - mismatch must fail fast

Recommended rule:
- Source of truth for tenant = session user + `org_members`
- Optional request hint = `x-organization-id`

### 4.2 REST / RPC / Edge / Railway 分工原則

Keep in Supabase REST:
- simple CRUD on tenant-safe tables
- low-complexity reads already fully protected by RLS

Keep in Supabase RPC:
- quota checks
- lightweight transactional business rules
- org/project derived calculations
- tightly DB-centric operations where RLS and FK constraints are sufficient

Move to Railway backend:
- multi-step workflows
- integrations with external vendors
- AI/OCR orchestration
- webhooks
- file-processing pipelines
- privileged admin tools
- any logic needing secret provider credentials or complex retries

Use Edge Functions when:
- low-latency Supabase-adjacent logic is needed
- signed URL generation or lightweight authenticated server logic is enough
- but avoid turning Edge Functions into the main integration backbone if Railway is already the core orchestration layer

Recommended future split:
- Supabase: data plane
- Railway: orchestration and integration plane
- Edge Functions: small trusted adapters

## 5. Environment 分離策略

### 5.1 staging / production 完整分離規則

Must be separate for:
- Supabase project
- Railway project or at minimum Railway environment
- storage buckets
- API base URLs
- auth redirect URLs
- cron/scheduled jobs
- webhook endpoints
- secrets/tokens

Recommended naming:
- `cirqua-staging`
- `cirqua-production`

Deployment rule:
- no shared credentials across staging and production
- no shared write-capable service role keys
- no staging frontend pointing at production APIs

### 5.2 `VITE_API_BASE_URL` 防呆策略

Recommended controls:
- build-time assertion that production builds can only use production domains
- staging builds can only use staging domains
- fail CI if `VITE_API_BASE_URL` does not match environment allowlist

Example rule:
- preview/staging allowed hosts:
  - `staging.api.cirqua.example`
  - `*.up.railway.app`
- production allowed hosts:
  - `api.cirqua.example`

### 5.3 如何避免 preview 打到 production

Required safeguards:
- separate preview env vars
- separate Supabase project for preview/staging if previews are interactive
- frontend startup check that warns/refuses to run when hostname and API base mismatch
- backend allowlist for allowed frontend origins per environment
- write protection on preview accounts where possible

Recommended policy:
- preview never points to production write endpoints
- at most, preview may read from sanitized staging data

## 6. Minimal Refactor Plan（最小重構）

### 6.1 不破壞現有系統的修復順序

1. Restore access and audit metadata
2. Add migration framework to Git
3. Add `org_id` columns as nullable
4. Backfill `org_id` from `projects`
5. Add FK constraints in non-breaking phases
6. Introduce RLS policies in report-only / test-first mode
7. Validate with staging test users
8. Enforce `NOT NULL` where backfill is complete
9. Move privileged workflows to Railway incrementally

### 6.2 migration 設計策略

Use phased migrations:

Phase A:
- add columns
- add indexes
- add helper views

Phase B:
- backfill data
- log orphan rows
- stop if mismatch found

Phase C:
- add FKs `not valid` when appropriate
- validate constraints after cleanup

Phase D:
- enable RLS
- add policies
- tighten grants

Phase E:
- enforce `NOT NULL`
- remove legacy assumptions

### 6.3 哪些可以「不重寫只補強」

Can likely be strengthened without rewrite:
- existing Supabase CRUD endpoints
- current RPCs:
  - `can_add_member`
  - `can_create_project`
  - `get_org_usage`
- project-based operational tables
- current profile/member/project model

Should avoid big rewrite now:
- do not replace Supabase with a new backend stack
- do not redesign the entire domain model before RLS/FK/tenant hardening is done
- do not introduce a second tenant key model

## 7. Target Architecture（修復後）

### 7.1 正確的 CIRQUA 架構

Text architecture:

1. Frontend
   - authenticates with Supabase Auth
   - carries bearer token
   - chooses active organization in UI state

2. Supabase
   - stores tenant-bound operational data
   - enforces RLS using `org_id`
   - handles simple CRUD and DB-centric RPCs

3. Railway backend
   - handles integration workflows, admin tools, webhooks, AI/OCR orchestration, and background jobs
   - uses trusted service credentials
   - writes back into Supabase through controlled paths

4. Storage / documents
   - receipts and legal docs flow through storage with tenant-safe path conventions

5. Audit and observability
   - privileged actions logged to audit tables
   - deployment/runtime logs separated by environment

### 7.2 tenant flow

Tenant flow:
- user signs in
- session resolves `auth.uid()`
- system loads active org memberships from `org_members`
- user selects active org
- UI may send `x-organization-id` as a hint
- DB authorization still resolves from `auth.uid()` + `org_members`
- all operational rows are filtered by `org_id`

### 7.3 API flow

API flow:
- simple tenant-safe CRUD:
  - frontend -> Supabase REST/RPC
- complex integration flow:
  - frontend -> Railway API
  - Railway validates token/session
  - Railway calls vendors / OCR / AI / queues
  - Railway persists final state to Supabase

### 7.4 AI / OCR 未來接入位置

Recommended integration point:
- AI/OCR should live behind Railway, not directly in client or raw Supabase RPC

Suggested flow:
- upload receipt/document
- Railway job picks up file
- OCR extracts structured data
- AI enriches classification or anomaly detection
- normalized output writes into:
  - `receipts`
  - `expense_records`
  - `legal_documents`
  - `activity_logs`

Benefits:
- keeps provider secrets off the client
- supports retries, queues, idempotency, and auditability
- avoids overloading Supabase with non-DB orchestration concerns

## Estimated Delivery

Estimated effort:
- P0 access recovery and audit setup: `2-4` person-days
- tenant key hardening and migrations: `4-7` person-days
- RLS/grants/constraint rollout with staging validation: `5-8` person-days
- environment separation and deployment guardrails: `2-4` person-days
- API contract normalization and minimal Railway orchestration baseline: `4-6` person-days

Total estimate:
- `17-29 person-days`

Practical target:
- a focused team can likely bring CIRQUA to `>= 70 / 100` readiness in `3-5 weeks`

## Risk Assessment

High risks:
- hidden data inconsistencies may surface during `org_id` backfill
- enabling RLS without staging verification can break app flows
- missing source repositories may delay real integration hardening

Medium risks:
- legacy clients may assume project-only scoping
- production/staging misrouting may already exist and require environment cleanup
- profile/PII handling may require additional compliance controls

Lower risks:
- existing CRUD surface can likely be retained if tenant hardening is done correctly
- current RPCs appear narrow and can be preserved with better privilege control

Final recommendation:
- Do not start broad multi-system integration yet
- Start with a stabilization sprint focused on access recovery, schema hardening, RLS, and environment separation
- Once P0 and most P1 items are complete, CIRQUA should be able to move from exploratory readiness into controlled integration delivery
