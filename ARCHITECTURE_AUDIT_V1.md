# CTO Technical Review Report (Architecture Audit v1)

Audit date: 2026-04-28

Scope note:
- This audit is based on the current GitHub repository contents, the live Supabase REST/OpenAPI surface reachable at `https://pzidyucjmlivbwlbyckh.supabase.co`, and a staging Railway token check.
- The repository currently contains infrastructure notes and a generated database inventory, but no application frontend, backend, Edge Function source code, migration folders, CI config, or deployment manifests.
- Where evidence is unavailable, this report marks the item as `unknown`.

## 1. System Overview

- Project name: `CIRQUA`
- GitHub repo URL: `https://github.com/juliushsu/CIRQUA`
- Environments:
  - `dev`: unknown
  - `staging`: referenced by user, but deployment details could not be verified from the provided Railway token
  - `production`: Supabase project endpoint is live at `https://pzidyucjmlivbwlbyckh.supabase.co`
- Tech stack:
  - Frontend: unknown
  - Backend: Supabase REST/PostgREST is confirmed; custom backend service code is unknown
  - Supabase: Supabase database + PostgREST/OpenAPI are confirmed
  - AI: unknown

Architecture inference:
- The current live system appears to be database-centric, with application access exposed primarily through Supabase REST endpoints over the `public` schema.
- The domain model strongly suggests a project-finance / operations workflow with organization scoping, project membership, document handling, receipts, forms, alerts, and financial records.
- Multi-tenant intent is visible in schema design through `organizations`, `org_members`, `projects.org_id`, and organization-scoped RPCs.

## 2. Database (Supabase)

Connection status:
- Supabase REST/OpenAPI access: confirmed
- Direct Postgres connection using the supplied host `db.pzidyucjmlivbwlbyckh.supabase.co:5432`: failed on 2026-04-28 with `getaddrinfo ENOTFOUND`
- Impact: deep catalog inspection for RLS policy text, triggers, non-public schemas, and migration history could not be performed from the provided direct connection string

Tables (complete list observed from live OpenAPI, `public` schema):
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

Per-table RLS status:
- `activity_logs`: unknown
- `alerts`: unknown
- `expense_categories`: unknown
- `expense_records`: unknown
- `forms`: unknown
- `income_categories`: unknown
- `income_records`: unknown
- `legal_documents`: unknown
- `org_members`: unknown
- `organizations`: unknown
- `profiles`: unknown
- `project_members`: unknown
- `projects`: unknown
- `receipts`: unknown

RLS policies (summary):
- No RLS policy definitions could be extracted from the current repository or via the reachable REST/OpenAPI metadata.
- Because the live API exposes organization-scoped RPCs and organization/project membership tables, RLS is likely important to the intended architecture, but actual enforcement is `unknown`.
- CTO concern: this is a high-risk blind spot until direct DB metadata or migration SQL is reviewed.

Functions / RPC list:
- `rpc/can_add_member`
  - method: `POST`
  - payload: `{ org_uuid: uuid }`
  - purpose inference: checks whether an organization may add another member
- `rpc/can_create_project`
  - method: `POST`
  - payload: `{ org_uuid: uuid }`
  - purpose inference: checks whether an organization may create another project
- `rpc/get_org_usage`
  - method: `POST`
  - payload: `{ org_uuid: uuid }`
  - purpose inference: returns organization usage for plan / quota enforcement

Triggers:
- unknown

Migration management:
- No `supabase/migrations`, SQL migration files, Prisma migrations, or equivalent schema version-control artifacts are present in the repository snapshot reviewed on 2026-04-28.
- Migration management status: no repository evidence found
- Version control status for DB schema: effectively `unknown`, but there is no visible migration history in Git

Schema observations:
- `organizations` includes plan and quota fields such as `plan_type`, `max_projects`, `max_members`, and `max_storage_mb`
- `org_members` models user-to-organization membership with `org_role` and `is_active`
- `projects` includes `org_id`, `owner_id`, `project_manager_id`, `budget`, `spent`, `currency`, and lifecycle fields
- `project_members` adds project-level role assignment separate from org membership
- Financial modules are normalized into category tables and record tables
- `profiles` contains sensitive PII and banking-related fields, increasing security and compliance requirements

## 3. API / Edge Functions

Edge Functions list:
- No Supabase Edge Function source files or deployment definitions were found in the repository
- Edge Functions status: `unknown`

Backend API endpoints (observed from published Supabase OpenAPI):
- `GET /`
- `GET|POST|DELETE|PATCH /activity_logs`
- `GET|POST|DELETE|PATCH /alerts`
- `GET|POST|DELETE|PATCH /expense_categories`
- `GET|POST|DELETE|PATCH /expense_records`
- `GET|POST|DELETE|PATCH /forms`
- `GET|POST|DELETE|PATCH /income_categories`
- `GET|POST|DELETE|PATCH /income_records`
- `GET|POST|DELETE|PATCH /legal_documents`
- `GET|POST|DELETE|PATCH /org_members`
- `GET|POST|DELETE|PATCH /organizations`
- `GET|POST|DELETE|PATCH /profiles`
- `GET|POST|DELETE|PATCH /project_members`
- `GET|POST|DELETE|PATCH /projects`
- `GET|POST|DELETE|PATCH /receipts`
- `POST /rpc/can_add_member`
- `POST /rpc/can_create_project`
- `POST /rpc/get_org_usage`

Per-endpoint auth mechanism and `x-organization-id` usage:

| Endpoint | Method(s) | Auth mechanism | Uses `x-organization-id` |
| --- | --- | --- | --- |
| `/` | GET | Supabase REST key/Bearer required in practice; OpenAPI declaration does not specify security | no evidence |
| `/activity_logs` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/alerts` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/expense_categories` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/expense_records` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/forms` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/income_categories` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/income_records` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/legal_documents` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/org_members` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/organizations` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/profiles` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/project_members` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/projects` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/receipts` | GET, POST, DELETE, PATCH | unknown at policy level; accessed via Supabase REST | no evidence |
| `/rpc/can_add_member` | POST | Supabase REST key/Bearer required in practice; policy rules unknown | no, but body requires `org_uuid` |
| `/rpc/can_create_project` | POST | Supabase REST key/Bearer required in practice; policy rules unknown | no, but body requires `org_uuid` |
| `/rpc/get_org_usage` | POST | Supabase REST key/Bearer required in practice; policy rules unknown | no, but body requires `org_uuid` |

Notes:
- The published OpenAPI specification does not declare `securityDefinitions` and does not reference an `x-organization-id` header.
- Multi-tenant scoping appears to rely on row data such as `org_id`, `project_id`, and RPC parameters like `org_uuid`, not on a custom request header.

## 4. Auth & Multi-Tenant Model

- Uses Supabase Auth or other:
  - Supabase Auth is likely intended because several tables store `uuid` user references (`user_id`, `owner_id`, `project_manager_id`, `uploaded_by`, `created_by`)
  - Direct repository proof of auth implementation is not present
  - Final assessment: likely Supabase Auth, but implementation evidence is `unknown`

- User → Organization relationship model:
  - `profiles.id` appears to represent the user profile key
  - `org_members` links `user_id` to `org_id`
  - `org_members.org_role` suggests organization-level authorization
  - `project_members` links `user_id` to `project_id` with a separate `role`
  - `projects.org_id` ties projects back to organizations

- Role design:
  - Organization-level role field: `org_members.org_role`
  - Project-level role field: `project_members.role`
  - Profile-level admin metadata: `profiles.role`, `profiles.level`, `profiles.admin_level`
  - Actual allowed role values such as `owner`, `admin`, `member`, or `demo`: unknown from current evidence

- Multi-org support:
  - Supported by schema design: yes, strongly indicated
  - Verified from runtime behavior: unknown

Assessment:
- The schema is aligned with a multi-tenant SaaS model where organizations own projects and users can belong to an org and to individual projects.
- However, without verified RLS or app-layer authorization code, tenant isolation cannot yet be considered proven.

## 5. Environment & Deployment

ENV variables:
- Confirmed from working audit workflow:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_SECRET`
  - `RAILWAY_TOKEN`
- Application runtime env variable set from repo code: unknown

Deployment method:
- GitHub Actions: no workflow files found
- Railway: user indicated staging uses Railway, but supplied token returned `Unauthorized` on 2026-04-28, so deployment topology could not be verified
- Manual deployment: unknown
- Production deployment mechanism: unknown

Supabase branching / staging:
- unknown

Domain / API routing structure:
- Confirmed domain:
  - Supabase REST base: `https://pzidyucjmlivbwlbyckh.supabase.co/rest/v1`
- Custom app domain: unknown
- API gateway / reverse proxy / BFF layer: unknown
- Edge routing between environments: unknown

Operational assessment:
- There is not enough repository evidence to confirm CI/CD maturity, environment isolation, secret management discipline, or release promotion flow.
- Staging visibility is currently blocked by an invalid or unauthorized Railway token.

## 6. Known Issues & Tech Debt

Known bugs:
- Direct Postgres connection string provided for audit is not usable as of 2026-04-28 because the hostname does not resolve
- Staging Railway token provided for audit returned `Unauthorized`

Architecture limitations:
- No visible migration history in Git, which blocks reliable schema review and reproducible environment setup
- No visible application code in the reviewed repository snapshot, preventing full-stack architecture verification
- No verified RLS or policy evidence, creating uncertainty around tenant isolation and data security
- The published API surface is table-centric PostgREST, which can scale quickly for CRUD delivery but may become hard to govern if business logic grows outside typed service boundaries
- Sensitive PII and banking fields exist in `profiles`, increasing the need for strict access control, audit logging, and field-level handling discipline

Incomplete features:
- Edge Functions: unknown / not evidenced
- Deployment automation: unknown / not evidenced
- Staging environment observability: incomplete due token failure
- Trigger catalog and advanced database automation: unknown

Workaround design currently in place:
- For this audit, schema inventory was generated from Supabase REST/OpenAPI instead of direct Postgres catalog access
- Organization-scoped quota checks appear to be implemented via RPCs:
  - `can_add_member`
  - `can_create_project`
  - `get_org_usage`
- Data lineage helpers appear present through `data_source` and `seed_batch_id` columns across many tables

CTO risk summary:
- High risk: authorization posture is not auditable from the current materials
- High risk: deployment and environment controls are not auditable from the current materials
- Medium risk: direct DB access configuration appears stale or incorrect
- Medium risk: repository does not currently represent the full runnable system, reducing change traceability
- Medium risk: business logic may be split between implicit client behavior and database RPCs without a visible service boundary

Recommended next actions:
- Restore a working direct Postgres or Supabase admin connection and export RLS, policies, triggers, indexes, and full schema metadata
- Add database migrations to Git if they exist outside the repo
- Add app source, Edge Functions, and deployment manifests to the same repository or document the split-repo topology
- Verify actual role enums and tenant-isolation logic with live auth sessions
- Reissue a valid Railway staging token or link the project locally for deployment audit
