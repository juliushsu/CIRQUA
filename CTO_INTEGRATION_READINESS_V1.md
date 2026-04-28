# CTO Integration Readiness Report v1

Audit date: 2026-04-28

Scope note:
- This report extends `Architecture Audit v1` and focuses on whether CIRQUA is ready to enter integrated development across Readdy / Codex / Supabase / Railway.
- Findings are based on the current repository contents, live Supabase REST/OpenAPI metadata, and a Railway token validation attempt.
- No destructive queries were executed. SQL below is verification-only.

## 1. Audit Blockers

### Current blockers

1. Direct Postgres host cannot be resolved
   - Observed error on 2026-04-28: `getaddrinfo ENOTFOUND db.pzidyucjmlivbwlbyckh.supabase.co`
   - Reasonable causes:
     - Supabase direct DB hostname has changed and the provided connection string is stale
     - The project now expects pooler-based access instead of the old `db.<project-ref>.supabase.co` hostname
     - Direct DB networking is disabled or restricted for the project
     - The connection string was copied from an outdated project setting or old environment

2. Railway staging token returns `Unauthorized`
   - Observed on 2026-04-28 for both `railway whoami` and `railway list`
   - Reasonable causes:
     - Token is expired, revoked, or regenerated
     - Token belongs to another workspace/user and lacks project access
     - Token is valid but not permitted for the requested commands due to scope restrictions
     - The staging project may have been transferred, archived, or removed

3. Repository does not contain runnable application or deployment source
   - Current repo contains inventory artifacts and audit documents, but no frontend, backend app, edge function source, migration history, or CI/CD config
   - This blocks a full integration audit because system behavior cannot be traced from code to deployment

### Data that cannot currently be verified

- PostgreSQL version and full catalog metadata
- Per-table RLS enabled flags
- RLS policy definitions and policy coverage gaps
- Function ownership, security definer/invoker posture, and grant boundaries
- Trigger inventory
- Table privileges for `anon`, `authenticated`, and `service_role`
- Indexes, constraints, extensions, and non-public schemas
- Supabase staging/branching setup
- Railway services, domains, variables, deploy history, and environment split
- Real frontend/backend auth flow
- Real Edge Functions existence
- Readdy/Codex/AI workflow entrypoints

### Recommended repair order

1. Restore working Supabase admin/Postgres metadata access
2. Restore valid Railway staging access
3. Add or link the missing app source and DB migrations into GitHub
4. Verify auth/RLS/tenant isolation with real authenticated sessions
5. Verify environment split and deployment paths across staging and production

## 2. Supabase Security Verification Plan

The following SQL is recommended for audit execution once direct database access is restored. These queries are read-only and intended for verification.

### RLS enabled status

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
order by n.nspname, c.relname;
```

### Policies list

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### Functions / RPC ownership and security posture

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as return_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'auth', 'storage')
order by n.nspname, p.proname;
```

### Triggers list

```sql
select
  event_object_schema as schema_name,
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;
```

### Grants / privileges

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;
```

### Column-level privileges

```sql
select
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
order by table_name, column_name, grantee, privilege_type;
```

### Function execute grants

```sql
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
order by routine_name, grantee;
```

### Check whether `anon` / `authenticated` have oversized access

```sql
select
  grantee,
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by grantee, table_name
order by grantee, table_name;
```

```sql
select
  grantee,
  routine_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by grantee, routine_name
order by grantee, routine_name;
```

### Recommended acceptance criteria

- All tenant-bearing tables have RLS enabled
- `anon` has no write access to operational tables
- `authenticated` only has least-privilege access and is constrained by RLS
- High-risk RPCs use the minimum required privilege model and are reviewed for `security definer`
- Sensitive profile/banking fields are not broadly readable

## 3. Multi-Tenant Isolation Check

### Public table tenant-key scan

| Table | Has `org_id` / `organization_id` | Has `project_id` | Tenant observation |
| --- | --- | --- | --- |
| `activity_logs` | no | yes | indirect tenant via project |
| `alerts` | no | yes | indirect tenant via project |
| `expense_categories` | no | yes | indirect tenant via project |
| `expense_records` | no | yes | indirect tenant via project |
| `forms` | no | yes | indirect tenant via project |
| `income_categories` | no | yes | indirect tenant via project |
| `income_records` | no | yes | indirect tenant via project |
| `legal_documents` | no | yes | indirect tenant via project |
| `org_members` | yes | no | direct tenant via organization |
| `organizations` | no | no | tenant root table |
| `profiles` | no | no | global/shared identity table |
| `project_members` | no | yes | indirect tenant via project |
| `projects` | yes | no | direct tenant via organization |
| `receipts` | no | yes | indirect tenant via project |

### Tables with organization key

- `org_members`
- `projects`

### Tables with project key

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

### Tables that may need `organization_id` but currently do not have it

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
- These tables appear to rely on `project_id` for tenant scoping.
- That is workable only if every `project_id` always resolves to exactly one organization and all authorization checks consistently join through `projects`.
- Missing direct `org_id` makes analytics, policy authoring, backfills, and cross-system integrations more fragile.

### Tables that may cause cross-company data contamination

- `profiles`
  - Global user profile table with no visible org scoping
  - Contains sensitive PII/banking data
  - Risk if profile access is not tightly limited
- `project_members`
  - Relies on `project_id` only
  - Risk if project membership checks are weak or if orphaned project references exist
- `receipts`
  - Indirect tenant linkage through project only
  - Financial/document data is high sensitivity
- `legal_documents`
  - Indirect tenant linkage through project only
  - High sensitivity and legal exposure
- `activity_logs`
  - Audit trails can leak cross-tenant operational data if joins are not tenant-safe
- `alerts`
  - Notification records can leak other-tenant workflow state if tenant filters are weak

### Suggested canonical tenant key

- Recommended canonical tenant key: `org_id`
- Recommended model:
  - `organizations.id` is the tenant root
  - `projects.org_id` maps projects to tenant
  - All project-scoped operational tables should either:
    - carry both `project_id` and `org_id`, or
    - have enforced foreign keys plus RLS that always joins through `projects`

### Isolation assessment

- Current schema direction: promising
- Current verifiable isolation posture: incomplete
- Main risk: tenant isolation is inferred from schema shape, not yet proven by policies and grants

## 4. API Contract Check

### REST API endpoints

| Method | Path | Auth required? | Organization context required? | Project context required? | Type |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/` | yes in practice | no | no | debug / metadata |
| `GET,POST,DELETE,PATCH` | `/activity_logs` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/alerts` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/expense_categories` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/expense_records` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/forms` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/income_categories` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/income_records` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/legal_documents` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/org_members` | yes in practice | yes | no | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/organizations` | yes in practice | yes | no | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/profiles` | yes in practice | likely yes at policy layer | no | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/project_members` | yes in practice | indirect | yes | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/projects` | yes in practice | yes | no | read / write / admin |
| `GET,POST,DELETE,PATCH` | `/receipts` | yes in practice | indirect | yes | read / write / admin |

### RPC endpoints

| Method | Path | Auth required? | Organization context required? | Project context required? | Type |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/rpc/can_add_member` | yes in practice | yes, `org_uuid` body param | no | admin / quota |
| `POST` | `/rpc/can_create_project` | yes in practice | yes, `org_uuid` body param | no | admin / quota |
| `POST` | `/rpc/get_org_usage` | yes in practice | yes, `org_uuid` body param | no | admin / read |

### Edge Functions

- No Edge Functions were found in the repository
- Runtime existence in Supabase: unknown

### Railway API endpoints

- No Railway-backed application endpoints could be verified
- No service URLs, domains, or route definitions were accessible with the provided token
- Status: unknown

### API contract observations

- The current exposed surface is almost entirely table-oriented PostgREST CRUD plus three org-scoped RPCs
- No evidence of `x-organization-id` header usage was found in the published OpenAPI
- Organization context appears to be expressed in row data and RPC body params instead of request headers
- Contract maturity is limited because there is no versioned API layer, typed backend contract file, or application router source in the repo

## 5. Environment Repair Checklist

### Supabase connection

- Re-copy the current direct DB connection string from Supabase dashboard
- Confirm whether the project expects:
  - direct DB host
  - transaction pooler host
  - session pooler host
- Validate DNS resolution from a trusted workstation
- Confirm admin read-only audit access can run metadata queries
- Export schema metadata, RLS, policies, triggers, grants, and indexes

### Railway token / service auth

- Regenerate or reissue a valid staging token
- Verify token scope with `railway whoami` and `railway list`
- Link the correct project/environment locally
- Export service list, domains, variables, deployment history, and route map

### Staging / production separation

- Confirm whether staging and production use:
  - separate Railway projects
  - separate Supabase projects
  - separate domains
  - separate service tokens
- Document promotion path from staging to production
- Confirm whether Supabase branching is enabled or not

### GitHub repo migration traceability

- Add `supabase/migrations` or equivalent SQL history into Git
- Add backend/frontend runtime code or document the split-repo architecture
- Add deployment manifests or CI workflow definitions
- Add architecture ownership notes describing which repo controls which environment

### ENV names list

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET`
- `RAILWAY_TOKEN`
- App/runtime env names: unknown
- Readdy/Codex-specific env names: unknown
- OCR/AI provider env names: unknown

## 6. Integration Readiness Score

### Database readiness: 45 / 100

Reason:
- Strengths:
  - live Supabase project is reachable
  - 14 public tables and 3 RPCs are discoverable
  - schema direction is coherent for org/project finance workflows
- Weaknesses:
  - direct catalog access is broken
  - RLS, grants, triggers, indexes, and migrations are not verified
  - tenant security cannot be proven

### Auth / tenant readiness: 35 / 100

Reason:
- Strengths:
  - schema suggests a real multi-tenant model through `organizations`, `org_members`, `projects`, and `project_members`
  - org-scoped quota RPCs exist
- Weaknesses:
  - actual role values are not confirmed
  - RLS and privilege boundaries are unknown
  - `profiles` is globally scoped and sensitive
  - most operational tables depend on indirect tenant linkage via `project_id`

### API readiness: 55 / 100

Reason:
- Strengths:
  - live REST surface is published and discoverable
  - CRUD endpoints exist for all major data entities
  - three RPC endpoints support org-level quota/usage logic
- Weaknesses:
  - API is mostly raw PostgREST without visible service-layer governance
  - auth and authorization rules are not documented in code
  - no Edge Functions or backend router source were verified

### Deployment readiness: 20 / 100

Reason:
- Strengths:
  - there is at least a stated staging concept via Railway
- Weaknesses:
  - Railway token is unusable
  - no CI/CD or deployment manifests are in repo
  - no staging/production split is verifiable
  - no domain or route map is auditable

### AI/OCR pipeline readiness: 5 / 100

Reason:
- No AI pipeline, OCR service, model integration, prompt layer, queue, or file-processing code was found
- No related endpoints, env vars, or deployment services were verifiable
- If Readdy/Codex/AI integration is planned, the current repository does not yet evidence implementation readiness

### Overall readiness: 32 / 100

Reason:
- CIRQUA is not yet ready for confident cross-platform integration development
- The schema direction is useful and the Supabase surface is live, but the security, deployment, and runnable-system evidence are still too incomplete
- The project is suitable for discovery and repair work, not yet for high-confidence integrated delivery

## 7. Next Actions

### P0: now, blockers to integration

- Fix Supabase admin/Postgres access and validate the correct DB host
- Recover a valid Railway staging token and verify project access
- Export and review RLS, policies, grants, RPC ownership, and triggers
- Confirm whether tenant isolation is enforced via `org_id`, `project_id`, or both
- Identify where the actual frontend/backend source code lives and add it to the audit scope

### P1: should be fixed before active integration

- Add migration history to GitHub
- Document environment topology across dev/staging/production
- Decide and standardize canonical tenant key strategy, preferably `org_id`
- Add direct `org_id` to high-risk operational tables or formally document join-based tenant enforcement
- Document auth roles and map them to table/RPC permissions
- Define a stable API contract beyond raw table CRUD where business logic is sensitive

### P2: can be improved after integration starts

- Add architecture diagrams and ownership docs
- Add automated schema audits and privilege regression checks
- Add API versioning / service-layer hardening if product scope grows
- Add data classification for PII, finance, and legal artifacts
- Add observability docs for staging and production, including logs, tracing, and alert ownership
