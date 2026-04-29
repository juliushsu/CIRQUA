# CIRQUA True Schema Baseline

Generated: 2026-04-29

Authority order:
- `supabase/.temp/linked-project.json`
- `sprint1-artifacts/supabase_sprint1_snapshot.json`
- `db-inventory/supabase-database-inventory.json`

Evidence note:
- This baseline is derived from the last verified live CIRQUA audit on 2026-04-28.
- Current shell env does not expose fresh `SUPABASE_*` or `DATABASE_URL`, so this document does not pretend to be a newer live pull.
- Any proposal, migration draft, or Sprint plan that differs from the evidence below is non-authoritative.

## 1. Confirmed CIRQUA Supabase Project

- Supabase project ref: `pzidyucjmlivbwlbyckh`
- Project name: `CIRQUA(via Readdy)`
- Project status: `ACTIVE_HEALTHY`
- Region: `ap-northeast-1`
- Project URL: `https://pzidyucjmlivbwlbyckh.supabase.co`
- Direct DB host reported by Management API: `db.pzidyucjmlivbwlbyckh.supabase.co`
- Verified working audit path on 2026-04-28: `aws-1-ap-northeast-1.pooler.supabase.com:6543` via transaction pooler

## 2. Schema List

- `public`

No additional business schema was verified in the live audit evidence.

## 3. Public Tables

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

## 4. Table Baseline

RLS baseline from live audit:
- All 14 `public` tables: `RLS disabled`
- All 14 `public` tables: `force_rls = false`
- Policies in `public`: `0`

### `activity_logs`

- Columns: `id`, `project_id`, `user_id`, `action`, `details`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `alerts`

- Columns: `id`, `project_id`, `type`, `severity`, `title`, `message`, `is_read`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `expense_categories`

- Columns: `id`, `project_id`, `name`, `budget`, `spent`, `color`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `expense_records`

- Columns: `id`, `project_id`, `category_id`, `amount`, `date`, `description`, `vendor`, `receipt_id`, `created_by`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `forms`

- Columns: `id`, `project_id`, `name`, `type`, `status`, `data`, `created_by`, `created_at`, `updated_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `income_categories`

- Columns: `id`, `project_id`, `name`, `color`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `income_records`

- Columns: `id`, `project_id`, `category_id`, `amount`, `date`, `description`, `source`, `created_by`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `legal_documents`

- Columns: `id`, `project_id`, `title`, `type`, `file_url`, `uploaded_by`, `created_at`, `data_source`, `seed_batch_id`, `status`, `signing_date`, `expiry_date`, `parties`, `amount`, `currency`, `notes`, `version`, `effective_date`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `org_members`

- Columns: `id`, `org_id`, `user_id`, `org_role`, `is_active`, `joined_at`, `data_source`, `seed_batch_id`, `created_at`
- Has `org_id`: yes
- Has `project_id`: no
- RLS: disabled
- Policies: none

### `organizations`

- Columns: `id`, `name`, `tax_id`, `address`, `phone`, `email`, `plan_type`, `max_projects`, `max_members`, `max_storage_mb`, `is_active`, `subscription_start_date`, `subscription_end_date`, `data_source`, `seed_batch_id`, `created_at`, `updated_at`
- Has `org_id`: no
- Has `project_id`: no
- RLS: disabled
- Policies: none

### `profiles`

- Columns: `id`, `email`, `name`, `avatar`, `role`, `department`, `phone`, `id_number`, `bank_account`, `bank_name`, `created_at`, `updated_at`, `data_source`, `seed_batch_id`, `level`, `is_active`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone`, `bank_branch`, `bank_account_holder`, `admin_level`
- Has `org_id`: no
- Has `project_id`: no
- RLS: disabled
- Policies: none

### `project_members`

- Columns: `id`, `project_id`, `user_id`, `role`, `department`, `joined_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

### `projects`

- Columns: `id`, `name`, `description`, `status`, `budget`, `spent`, `start_date`, `end_date`, `owner_id`, `created_at`, `updated_at`, `data_source`, `seed_batch_id`, `base_currency`, `currency`, `type`, `project_manager_id`, `closed_at`, `org_id`
- Has `org_id`: yes
- Has `project_id`: no
- RLS: disabled
- Policies: none
- Data quality note: live audit found `3` rows with `org_id is null`

### `receipts`

- Columns: `id`, `project_id`, `title`, `amount`, `date`, `vendor`, `category`, `status`, `file_url`, `notes`, `uploaded_by`, `created_at`, `data_source`, `seed_batch_id`
- Has `org_id`: no
- Has `project_id`: yes
- RLS: disabled
- Policies: none

## 5. Functions / RPC

Verified in `public` during the live audit:

- `can_add_member(org_uuid uuid) -> boolean`
- `can_create_project(org_uuid uuid) -> boolean`
- `get_org_usage(org_uuid uuid) -> table(current_projects integer, current_members integer, current_storage_mb numeric)`
- `handle_new_user() -> trigger`

Function notes:
- Owner: `postgres`
- `handle_new_user()` is `security definer = true`
- `can_add_member`, `can_create_project`, `get_org_usage` are `security definer = false`

## 6. Baseline Boundary

This is the only authoritative CIRQUA baseline for this repo:
- one verified Supabase project
- one verified business schema: `public`
- fourteen verified business tables
- zero verified `public` policies
- four verified `public` functions / RPC entries

Anything that assumes additional columns, additional tables, extra schemas, or already-enabled RLS belongs to proposal space until re-verified against the live project.
