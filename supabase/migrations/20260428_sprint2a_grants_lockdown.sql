-- CIRQUA Sprint 2A draft only.
-- Purpose:
-- 1. Document staged privilege reduction for anon/authenticated.
-- 2. Avoid sudden frontend breakage by separating revoke plan from replacement path.
-- 3. Preserve service_role for controlled backend automation.

begin;

-- Current problem summary:
-- - anon can read projects
-- - anon can read profiles
-- - anon can execute get_org_usage
-- - authenticated currently has the same broad table privileges as anon
-- - RLS is not enabled, so grants are currently the primary exposure vector

-- Stage 1 revoke plan (review only, do not execute blind):
--
-- revoke all privileges on table public.projects from anon;
-- revoke all privileges on table public.profiles from anon;
-- revoke all privileges on function public.get_org_usage(uuid) from anon;
--
-- Broader staged revoke target after API compatibility review:
-- revoke all privileges on all tables in schema public from anon;
-- revoke all privileges on all tables in schema public from authenticated;
-- revoke execute on all functions in schema public from public;
-- revoke execute on all functions in schema public from anon;

-- Replacement access path design:
--
-- anon:
-- - no direct business-table access
-- - no business RPC execute
-- - allowed only explicitly public endpoints if product requires them
--
-- authenticated:
-- - access only through RLS-protected tables
-- - RPC execute only on approved, tenant-safe functions
--
-- service_role:
-- - retain broad access
-- - limit usage to trusted backend / automation contexts

-- Suggested replacement routes before revoke execution:
--
-- 1. projects
--    current exposure: direct REST table read
--    replacement path: authenticated REST read after RLS, or Railway-backed API for privileged views
--
-- 2. profiles
--    current exposure: direct REST table read
--    replacement path: self-profile endpoint or RLS-protected profile read model
--
-- 3. get_org_usage
--    current exposure: executable by anon and public
--    replacement path:
--      a. authenticated-only execute after RLS and role checks
--      b. or move to Railway privileged API if quota logic needs additional safeguards

-- Draft staged SQL (commented on purpose):
--
-- revoke execute on function public.get_org_usage(uuid) from public;
-- revoke execute on function public.get_org_usage(uuid) from anon;
-- grant execute on function public.get_org_usage(uuid) to authenticated;
-- grant execute on function public.get_org_usage(uuid) to service_role;
--
-- revoke select, insert, update, delete on public.projects from anon;
-- revoke select, insert, update, delete on public.profiles from anon;
-- revoke select, insert, update, delete on public.projects from authenticated;
-- revoke select, insert, update, delete on public.profiles from authenticated;
-- grant select on public.projects to authenticated;
-- grant select on public.profiles to authenticated;
-- Final authenticated grants must be re-reviewed after RLS exists.

commit;
