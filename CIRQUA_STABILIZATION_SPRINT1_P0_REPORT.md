# CIRQUA STABILIZATION SPRINT1 P0 REPORT

Audit date: 2026-04-28

Scope:
- Sprint 1 P0 only
- no feature work
- no UI work
- no cross-system integration
- read-only verification only

Supporting artifacts:
- Audit script: [scripts/sprint1_p0_audit.js](/Users/chishenhsu/Desktop/Codex/CIRQUA/scripts/sprint1_p0_audit.js)
- Read-only SQL set: [supabase/queries/sprint1_readonly_audit.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/queries/sprint1_readonly_audit.sql)
- Supabase snapshot: [supabase_sprint1_snapshot.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/sprint1-artifacts/supabase_sprint1_snapshot.json)

## 修復項目

### 1. Supabase Connection Repair

What was verified:
- `project ref` is confirmed as `pzidyucjmlivbwlbyckh`
- Supabase Management API reports project status `ACTIVE_HEALTHY`
- Official project metadata still reports direct DB host as `db.pzidyucjmlivbwlbyckh.supabase.co`
- That direct DB host has no DNS answer from this environment and also no answer from `1.1.1.1`
- Supabase pooler configuration is available and resolves correctly
- Read-only DB access was successfully repaired by using the pooler path instead of the dead direct host

Effective repaired audit path:
- DB host: `aws-1-ap-northeast-1.pooler.supabase.com`
- Port: `6543`
- Mode: transaction pooler

Read-only verification succeeded:
- `select now(), current_database(), current_user`
- full security metadata snapshot queries

Conclusion:
- Direct DB connection path remains broken for this environment
- Pooler path is currently the working and verified path for Sprint 1 audit work

### 2. Supabase Security Audit Snapshot

Observed `public` tables:
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

RLS status:
- All 14 `public` tables have `RLS disabled`
- All 14 `public` tables have `force_rls = false`

Policies:
- `0` policies found in `public`

Functions / RPCs:
- `can_add_member(org_uuid uuid) -> boolean`
- `can_create_project(org_uuid uuid) -> boolean`
- `get_org_usage(org_uuid uuid) -> table(...)`
- `handle_new_user() -> trigger`

Trigger snapshot:
- `auth.users -> on_auth_user_created -> handle_new_user()`
- `realtime.subscription -> tr_check_filters`
- `storage.buckets -> enforce_bucket_name_length_trigger`
- `storage.buckets -> protect_buckets_delete`
- `storage.objects -> protect_objects_delete`
- `storage.objects -> update_objects_updated_at`
- No custom trigger was found on `public` business tables

Grants / privileges summary:
- Every `public` table grants full CRUD-style privileges to:
  - `anon`
  - `authenticated`
  - `service_role`
  - `postgres`
- Observed table privileges are effectively:
  - `SELECT`
  - `INSERT`
  - `UPDATE`
  - `DELETE`
  - `REFERENCES`
  - `TRIGGER`
  - `TRUNCATE`
- Public routine execute grants are also over-open:
  - `can_add_member`: executable by `PUBLIC`, `anon`, `authenticated`, `service_role`
  - `can_create_project`: executable by `PUBLIC`, `anon`, `authenticated`, `service_role`
  - `get_org_usage`: executable by `PUBLIC`, `anon`, `authenticated`, `service_role`
  - `handle_new_user`: executable by `PUBLIC`, `anon`, `authenticated`, `service_role`

Data quality snapshot relevant to Sprint 2:
- `organizations`: `1` row
- `projects`: `3` rows
- `projects` with `org_id is null`: `3`
- `profiles`: `3` rows

Conclusion:
- Security posture is materially worse than previously assumed
- This is not just “RLS missing”; the current database is effectively open to `anon` and `authenticated` at the table-grant level

### 3. Railway Staging Auth Repair

What was verified:
- The provided Railway token is valid when used as `RAILWAY_TOKEN`
- It is not suitable for account-scope commands like `whoami` or `list`
- Project-scope commands succeeded and exposed the true staging status

Confirmed Railway status:
- Project name: `CIRQUA+`
- Workspace: `juliushsu's Projects`
- Environments:
  - `staging`
  - `production`
- Services: `0`
- Domains: none available because there are no services
- Private network: not disabled

Root cause of earlier `Unauthorized` result:
- The token was previously tested with account/workspace-scope commands
- The token behaves as a project/environment token, not an account token

Environment variable interpretation:
- `RAILWAY_TOKEN`: correct for this token type
- `RAILWAY_API_TOKEN`: would be required for account/workspace-level commands such as `whoami` and project listing

Conclusion:
- Railway auth is partially repaired in the sense that token scope is now correctly understood
- However, no staging service exists, so there is no staging API or protected route to probe

### 4. API Health / Auth Smoke Test

Tested surface:
- Supabase project root
- Supabase REST `projects` endpoint
- Supabase REST `profiles` endpoint
- Supabase RPC `get_org_usage`

Results:
- Public root:
  - `GET /` -> `404`
  - Interpretation: host is reachable, but no dedicated public health endpoint is published
- Protected endpoint without auth:
  - `GET /rest/v1/projects?select=id,org_id&limit=1` -> `401`
  - Interpretation: missing API key is blocked
- Protected endpoint with service auth:
  - same endpoint with service secret -> `200`
- Missing `x-organization-id`:
  - `200`
- Invalid `x-organization-id`:
  - `200`
- Valid `x-organization-id`:
  - `200`
- Result consistency:
  - all three `x-organization-id` variants returned the same payload
  - current Supabase REST surface does not enforce this header

Additional read-only exposure tests:
- `anon` can read `/projects` -> `200`
- `anon` can read `/profiles` -> `200`
- `anon` can execute `/rest/v1/rpc/get_org_usage` -> `200`

Conclusion:
- API key presence is enforced
- Tenant isolation is not enforced
- `x-organization-id` is currently advisory at best and ignored in the tested Supabase REST path

## 實際驗證結果

### 已完成

- Supabase project metadata verified through official Management API
- working DB audit connection path repaired via pooler
- full read-only security snapshot captured
- Railway token scope identified correctly
- Railway staging/project status captured
- API auth smoke tests executed
- reproducible audit script and SQL set committed to repo
- baseline `supabase/migrations` workspace created in Git

### 尚未解除的 blocker

- Direct Postgres host remains unresolved and unusable
- No Railway services exist in the verified project, so no staging API health route can be tested
- `projects.org_id` is null for all current project rows, which blocks straightforward tenant backfill
- Public data exposure remains active until Sprint 2 fixes RLS and grants

## 發現的新風險

1. `anon` can read live business data
   - confirmed on `projects`
   - confirmed on `profiles`

2. `anon` can execute business RPC
   - confirmed on `get_org_usage`

3. All `public` tables lack RLS
   - full tenant isolation is absent

4. All current `projects.org_id` values are null
   - the canonical tenant key is not actually populated yet

5. Railway project currently has no services
   - staging exists as an environment shell, not as a deployed API/application

6. No dedicated health endpoint is published
   - reachability can be tested, but health semantics are not standardized

## 是否可進入 Sprint 2

Yes, with constraints.

Reason:
- Sprint 1 successfully removed the “unknown state” problem
- The true blockers are now explicit and measurable
- Sprint 2 should proceed immediately because it is the sprint that addresses the newly confirmed security and tenant issues

Constraint:
- This is a `Go` for stabilization hardening only
- This is not a `Go` for integration release, public exposure, or production confidence

## CTO 建議判斷

Go

Decision framing:
- `Go` for Sprint 2 hardening work
- `No-Go` for any broader system integration release until Sprint 2 completes

Rationale:
- Audit unblock objective is achieved
- True infrastructure and security status is now known
- The next actions are unambiguous:
  - populate canonical tenant key
  - lock down grants
  - enable RLS
  - validate staged isolation
