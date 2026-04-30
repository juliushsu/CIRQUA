# CIRQUA Supabase Security Rotation SQL Draft

## Purpose

This draft records the SQL-side boundary for CIRQUA security rotation planning. Password resets are not a SQL workflow in the confirmed operating model below.

## Guardrails

- This file is a planning draft only.
- Do not execute live rotation from this document.
- Do not add any real password.
- Do not add any `service_role` value.
- Do not assume `main` is an allowed working branch.

## S3 User-Confirmed Constraints

- Password reset path: Supabase Dashboard email reset first.
- Optional future path: server-side admin password reset script only.
- Owner account: `juliushsu@gmail.com`.
- Railway token boundary: Codex staging only, production isolated.

## SQL Boundary

- Manual password reset is currently handled by sending a password reset email through Supabase operational tooling, not through SQL.
- Do not propose SQL statements that pretend the dashboard can directly change passwords as the standard operator path.
- Do not add SQL that embeds, derives, or stores replacement passwords for live users.

## Future Non-SQL Admin Path

- If CIRQUA later needs bulk password reset, implement it as a server-side admin script only.
- The script must call Supabase Auth Admin API `updateUserById`.
- The script must use `service_role` only in a protected server environment.
- The script must never be implemented in client-side code.
- The `service_role` secret must never be committed to this repository.

## Draft SQL Planning Notes

The following SQL-adjacent tasks are acceptable because they support auditing without changing passwords:

```sql
-- Example planning-only checks for account inventory before any separate
-- server-side reset workflow is designed.
-- Do not use SQL here to assign or replace passwords.

-- Review application-side references to owner/user accounts.
-- Replace table names only after confirming the live schema.
select 'planning_only' as status;
```

## Owner / Environment Context

- Owner account for validation and self-service data review: `juliushsu@gmail.com`.
- Railway environment split is confirmed: `staging` and `production`.
- Codex may operate only within the staging token boundary; production access remains out of scope.
