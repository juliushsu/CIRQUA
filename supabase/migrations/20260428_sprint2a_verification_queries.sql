-- Sprint 2A read-only verification queries.

-- 1. RLS enabled status.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2. anon grants.
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
group by table_name
order by table_name;

-- 3. authenticated grants.
select
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
group by table_name
order by table_name;

-- 4. policy existence.
select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. projects.org_id null count.
select count(*)::int as projects_org_id_null_count
from public.projects
where org_id is null;

-- 6. Tenant backfill coverage by table.
select 'activity_logs' as table_name, count(*)::int as null_org_id_rows from public.activity_logs where org_id is null
union all
select 'alerts', count(*)::int from public.alerts where org_id is null
union all
select 'expense_categories', count(*)::int from public.expense_categories where org_id is null
union all
select 'expense_records', count(*)::int from public.expense_records where org_id is null
union all
select 'forms', count(*)::int from public.forms where org_id is null
union all
select 'income_categories', count(*)::int from public.income_categories where org_id is null
union all
select 'income_records', count(*)::int from public.income_records where org_id is null
union all
select 'legal_documents', count(*)::int from public.legal_documents where org_id is null
union all
select 'project_members', count(*)::int from public.project_members where org_id is null
union all
select 'receipts', count(*)::int from public.receipts where org_id is null
order by table_name;

-- 7. Cross-tenant-read risk heuristic.
-- This is a static risk signal, not a runtime auth simulation.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', format('public.%I', c.relname), 'select') as anon_can_select,
  has_table_privilege('authenticated', format('public.%I', c.relname), 'select') as authenticated_can_select,
  case
    when c.relrowsecurity = false
      and (
        has_table_privilege('anon', format('public.%I', c.relname), 'select')
        or has_table_privilege('authenticated', format('public.%I', c.relname), 'select')
      )
    then true
    else false
  end as cross_tenant_read_risk
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;
