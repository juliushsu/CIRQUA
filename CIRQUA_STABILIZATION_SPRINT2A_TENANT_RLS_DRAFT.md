# CIRQUA STABILIZATION SPRINT2A TENANT RLS DRAFT

Audit date: 2026-04-28

Scope:
- Sprint 2A only
- create migration skeletons
- do not apply migrations
- do not mutate production data
- do not guess production tenant automatically

## 本輪新增檔案

Report:
- [CIRQUA_STABILIZATION_SPRINT2A_TENANT_RLS_DRAFT.md](/Users/chishenhsu/Desktop/Codex/CIRQUA/CIRQUA_STABILIZATION_SPRINT2A_TENANT_RLS_DRAFT.md)

Migration drafts:
- [20260428_sprint2a_tenant_backfill_prepare.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_tenant_backfill_prepare.sql)
- [20260428_sprint2a_rls_policy_skeleton.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_rls_policy_skeleton.sql)
- [20260428_sprint2a_grants_lockdown.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_grants_lockdown.sql)
- [20260428_sprint2a_verification_queries.sql](/Users/chishenhsu/Desktop/Codex/CIRQUA/supabase/migrations/20260428_sprint2a_verification_queries.sql)

Supporting artifact:
- [project_org_mapping_draft.json](/Users/chishenhsu/Desktop/Codex/CIRQUA/sprint2-artifacts/project_org_mapping_draft.json)

## 現有 projects 狀態

Current project rows:

| project_id | name | org_id | owner_id | project_manager_id |
| --- | --- | --- | --- | --- |
| `proj-1` | `《夏日時光》長片製作` | `null` | `dfb0a87d-0805-4215-8614-81ee6ad42d51` | `null` |
| `proj-2` | `《城市印象》廣告片` | `null` | `dfb0a87d-0805-4215-8614-81ee6ad42d51` | `null` |
| `proj-3` | `《記憶拼圖》紀錄片` | `null` | `dfb0a87d-0805-4215-8614-81ee6ad42d51` | `null` |

Related evidence:
- there is `1` current organization row
- there are `2` current `org_members` rows
- the project owner is an active `owner` in the sole current organization
- there are currently no `project_members` rows
- there are no child table rows tied to any project

## projects.org_id 修復策略

### 是否可從其他表推導 org_id

Partially, but not with production-safe certainty.

What can be inferred:
- The current project owner is an active owner of the only existing organization.
- All three projects share the same owner.
- There is no contradictory organization data in other project-linked tables.

Why this is still not safe for blind production backfill:
- `projects.org_id` is currently `null` for all projects
- no project-scoped child data exists to independently confirm tenant assignment
- no `project_members` rows exist
- the system currently lacks an already-enforced canonical tenant key

Decision:
- inference is strong enough to create a manual mapping draft
- inference is not strong enough to auto-apply a production backfill without approval

### 人工 mapping 草案

| project_id | current_org_id | proposed_org_id | confidence | reason |
| --- | --- | --- | --- | --- |
| `proj-1` | `null` | `53a14fc1-0c54-4cf2-bfc1-546fd12db86f` | `medium` | Project owner is an active owner in the only current organization, but no persisted project tenant key or child-row evidence exists. |
| `proj-2` | `null` | `53a14fc1-0c54-4cf2-bfc1-546fd12db86f` | `medium` | Project owner is an active owner in the only current organization, but no persisted project tenant key or child-row evidence exists. |
| `proj-3` | `null` | `53a14fc1-0c54-4cf2-bfc1-546fd12db86f` | `medium` | Project owner is an active owner in the only current organization, but no persisted project tenant key or child-row evidence exists. |

Required approval before any update:
- confirm the sole organization is the intended owner of all three seeded projects
- approve project-to-org mapping explicitly
- record approver and timestamp

## 每張表的 tenant hardening 建議

| Table | Has `org_id` now | Has `project_id` now | Suggested RLS mode | Recommendation |
| --- | --- | --- | --- | --- |
| `activity_logs` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects`, later enforce org-scoped RLS with project integrity checks |
| `alerts` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `expense_categories` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `expense_records` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `forms` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `income_categories` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `income_records` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `legal_documents` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects`, treat as high-risk due legal sensitivity |
| `org_members` | yes | no | `org-scoped` | keep direct tenant key, use org-member and org-admin policies |
| `organizations` | no parent tenant | no | `org-scoped` | read own org, admin-heavy writes only |
| `profiles` | no | no | `admin-only` | do not auto-open via generic RLS; define self-profile plus admin exception model later |
| `project_members` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects` |
| `projects` | yes but null data | no | `org-scoped` | manual mapping first, then backfill and lock down |
| `receipts` | no | yes | `project-scoped` | add nullable `org_id`, backfill from `projects`, high-risk due financial/document exposure |

Canonical tenant rule:
- `org_id` should be the only canonical tenant key
- `project_id` should remain a business scope key, not the security boundary by itself

## RLS policy skeleton 摘要

What the draft contains:
- table-by-table tenant mode classification
- org-scoped helper pattern
- org-admin write helper pattern
- commented enable/policy examples for `projects`
- comment-wrapped high-risk table enablement blocks

High-risk tables intentionally not enabled in draft:
- `profiles`
- `organizations`
- `org_members`
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

Why they remain comment-wrapped:
- `projects.org_id` is still null everywhere
- child tables cannot be safely authorized before canonical tenant key backfill
- current `anon` / `authenticated` grants are too broad, so RLS must be introduced alongside grant review, not in isolation

## Grants lockdown 摘要

Current risk confirmed in Sprint 1:
- `anon` can read `projects`
- `anon` can read `profiles`
- `anon` can execute `get_org_usage`

Draft revoke plan:
- revoke direct `anon` access to `projects`
- revoke direct `anon` access to `profiles`
- revoke `anon` execute on `get_org_usage`
- later revoke broad `authenticated` access and re-grant only RLS-safe access
- preserve `service_role` for trusted automation

Replacement path design before revoke:
- `projects`
  - move to authenticated RLS-protected read
  - or Railway-backed privileged read if special aggregation is needed
- `profiles`
  - move to self-profile and approved admin path
- `get_org_usage`
  - keep only for authenticated users after role checks
  - or move behind Railway if broader quota logic is required

Role split summary:
- `anon`: no business table access, no business RPC execute
- `authenticated`: least privilege plus RLS
- `service_role`: broad access retained for trusted backend/server contexts only

## 尚不能自動執行的原因

1. `projects.org_id` is null for every current project row
2. there is no independently strong tenant evidence beyond owner membership in the sole organization
3. high-risk tables still lack canonical tenant key
4. grants are currently wide open, so careless sequencing could either:
   - break the current client unexpectedly
   - or leave exposure open while giving false confidence
5. `profiles` lacks a finalized tenant visibility model

Operational conclusion:
- Sprint 2A is ready for review
- Sprint 2B should only execute after:
  - manual mapping approval
  - migration sequencing signoff
  - staging dry-run plan approval

## CTO Go / No-Go 判斷

Go

Decision framing:
- `Go` for review and approval of migration skeletons
- `No-Go` for auto-applying tenant backfill or RLS enablement yet

Reason:
- The draft is now concrete, reviewable, and rollback-aware
- The remaining gating item is not engineering uncertainty, but tenant mapping approval and migration sequencing approval
