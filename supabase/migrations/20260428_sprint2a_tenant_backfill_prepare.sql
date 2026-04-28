-- CIRQUA Sprint 2A draft only.
-- Purpose:
-- 1. Prepare nullable org_id columns for tenant hardening.
-- 2. Add reviewable backfill scaffolding.
-- 3. Do NOT auto-assign production tenant values.
--
-- Execution status:
-- - Not applied
-- - Requires manual project->org mapping approval first
-- - Safe for review, not safe for unattended execution

begin;

-- 0. Pre-checks.
-- Review these before any change:
-- select id, name, org_id, owner_id, project_manager_id from public.projects order by created_at;
-- select id, name from public.organizations order by created_at;
-- select id, org_id, user_id, org_role from public.org_members order by created_at;

-- 1. Add nullable org_id columns to tenant-bound operational tables.
alter table if exists public.activity_logs add column if not exists org_id uuid;
alter table if exists public.alerts add column if not exists org_id uuid;
alter table if exists public.expense_categories add column if not exists org_id uuid;
alter table if exists public.expense_records add column if not exists org_id uuid;
alter table if exists public.forms add column if not exists org_id uuid;
alter table if exists public.income_categories add column if not exists org_id uuid;
alter table if exists public.income_records add column if not exists org_id uuid;
alter table if exists public.legal_documents add column if not exists org_id uuid;
alter table if exists public.project_members add column if not exists org_id uuid;
alter table if exists public.receipts add column if not exists org_id uuid;

-- 2. Add non-unique indexes to support later backfill, joins, and RLS.
create index if not exists idx_activity_logs_org_id on public.activity_logs (org_id);
create index if not exists idx_alerts_org_id on public.alerts (org_id);
create index if not exists idx_expense_categories_org_id on public.expense_categories (org_id);
create index if not exists idx_expense_records_org_id on public.expense_records (org_id);
create index if not exists idx_forms_org_id on public.forms (org_id);
create index if not exists idx_income_categories_org_id on public.income_categories (org_id);
create index if not exists idx_income_records_org_id on public.income_records (org_id);
create index if not exists idx_legal_documents_org_id on public.legal_documents (org_id);
create index if not exists idx_project_members_org_id on public.project_members (org_id);
create index if not exists idx_receipts_org_id on public.receipts (org_id);
create index if not exists idx_projects_org_id on public.projects (org_id);
create index if not exists idx_org_members_org_id on public.org_members (org_id);

-- 3. Draft manual mapping table for explicit project->org approval.
-- This table is intended as a temporary review aid and should be populated
-- manually after CTO / owner approval. Do not auto-seed proposed_org_id from
-- inference without signoff.
create table if not exists public.project_org_backfill_map (
  project_id text primary key,
  current_org_id uuid null,
  proposed_org_id uuid null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reason text not null,
  approved_by text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.project_org_backfill_map is
  'Temporary Sprint 2A manual mapping table. Do not use for runtime tenant authorization.';

-- 4. Example review-only backfill plan.
-- DO NOT EXECUTE until every row in project_org_backfill_map is approved.
--
-- update public.projects p
-- set org_id = m.proposed_org_id
-- from public.project_org_backfill_map m
-- where p.id = m.project_id
--   and p.org_id is null
--   and m.proposed_org_id is not null
--   and m.approved_at is not null;
--
-- update public.activity_logs t
-- set org_id = p.org_id
-- from public.projects p
-- where t.project_id = p.id
--   and t.org_id is null
--   and p.org_id is not null;
--
-- Repeat the same join-based pattern for:
-- alerts, expense_categories, expense_records, forms, income_categories,
-- income_records, legal_documents, project_members, receipts.

-- 5. Future FK constraints should be added in a later migration after:
-- - project org mapping approval
-- - backfill validation
-- - orphan cleanup

commit;
