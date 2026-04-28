-- CIRQUA Sprint 2A draft only.
-- Purpose:
-- 1. Establish reviewable RLS policy skeletons.
-- 2. Document intended tenant mode per table.
-- 3. Avoid direct enablement on high-risk tables until tenant key backfill is complete.
--
-- Important:
-- - High-risk tables remain comment-wrapped in this draft.
-- - Do not enable RLS on tables with null org_id backlog.
-- - Policy text is a skeleton and requires final review after tenant mapping.

begin;

-- Helper policy patterns (review only):
--
-- org-scoped read:
-- exists (
--   select 1
--   from public.org_members om
--   where om.org_id = <table>.org_id
--     and om.user_id = auth.uid()
--     and om.is_active = true
-- )
--
-- org-admin write:
-- exists (
--   select 1
--   from public.org_members om
--   where om.org_id = <table>.org_id
--     and om.user_id = auth.uid()
--     and om.is_active = true
--     and om.org_role in ('owner', 'admin')
-- )
--
-- project-scoped variant:
-- use org-scoped checks after tenant backfill, while still validating project_id integrity.

-- Table classification:
-- activity_logs       -> project-scoped
-- alerts              -> project-scoped
-- expense_categories  -> project-scoped
-- expense_records     -> project-scoped
-- forms               -> project-scoped
-- income_categories   -> project-scoped
-- income_records      -> project-scoped
-- legal_documents     -> project-scoped
-- org_members         -> org-scoped
-- organizations       -> org-scoped (admin-heavy writes)
-- profiles            -> admin-only until profile visibility model is finalized
-- project_members     -> project-scoped
-- projects            -> org-scoped
-- receipts            -> project-scoped

-- Lower-risk skeleton examples.
-- Enable only after org_id backfill and grant cleanup are ready.

-- alter table public.projects enable row level security;
-- create policy projects_select_org_member
-- on public.projects
-- for select
-- to authenticated
-- using (
--   exists (
--     select 1
--     from public.org_members om
--     where om.org_id = projects.org_id
--       and om.user_id = auth.uid()
--       and om.is_active = true
--   )
-- );
--
-- create policy projects_write_org_admin
-- on public.projects
-- for all
-- to authenticated
-- using (
--   exists (
--     select 1
--     from public.org_members om
--     where om.org_id = projects.org_id
--       and om.user_id = auth.uid()
--       and om.is_active = true
--       and om.org_role in ('owner', 'admin')
--   )
-- )
-- with check (
--   exists (
--     select 1
--     from public.org_members om
--     where om.org_id = projects.org_id
--       and om.user_id = auth.uid()
--       and om.is_active = true
--       and om.org_role in ('owner', 'admin')
--   )
-- );

-- High-risk tables remain fully comment-wrapped until tenant mapping is approved.

/*
alter table public.activity_logs enable row level security;
create policy activity_logs_select_org_member
on public.activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = activity_logs.org_id
      and om.user_id = auth.uid()
      and om.is_active = true
  )
);
*/

/*
alter table public.alerts enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expense_records enable row level security;
alter table public.forms enable row level security;
alter table public.income_categories enable row level security;
alter table public.income_records enable row level security;
alter table public.legal_documents enable row level security;
alter table public.project_members enable row level security;
alter table public.receipts enable row level security;
*/

/*
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
*/

/*
-- Profiles are intentionally separated because the current schema lacks a direct
-- tenant key and contains high-sensitivity PII/banking fields.
-- Final model should likely be:
-- - self-read / self-update
-- - org-admin scoped reads via approved admin tool
-- - service_role only for privileged automation
alter table public.profiles enable row level security;
*/

commit;
