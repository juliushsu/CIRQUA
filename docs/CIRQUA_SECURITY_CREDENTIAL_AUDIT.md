# CIRQUA Security Credential Audit

## Audit Scope

This document captures the currently confirmed credential and password-reset constraints for CIRQUA. It is an audit note, not an execution runbook.

## Guardrails

- No live rotation is executed from this repo update.
- No real password is introduced in documentation or git history.
- No `service_role` secret is added, echoed, or committed.
- No work should land on `main` as part of this documentation update.

## S3 User-Confirmed Constraints

- Password reset path: Supabase Dashboard email reset first.
- Optional future path: server-side admin password reset script only.
- Owner account: `juliushsu@gmail.com`.
- Railway token boundary: Codex staging only, production isolated.

## Confirmed Findings

### Supabase password reset path

- Current manual reset handling is based on sending a password reset email from Supabase operational tooling.
- The documentation must not assume the dashboard offers an approved direct-password-edit path.
- Any earlier wording that implied direct dashboard password editing should be considered unsupported unless separately re-confirmed.

### Bulk reset design boundary

- Future batch reset support, if ever required, must be implemented as a server-side admin script.
- That script may use `service_role` only in a protected server environment to call Supabase Auth Admin API `updateUserById`.
- That capability must not be placed in frontend code.
- That secret must not be committed to git.

### Owner account usage

- Confirmed owner account: `juliushsu@gmail.com`.
- Confirmed purpose: allow the user to sign in, inspect system data, and correct their own records where needed.

### Railway credential boundary

- Railway has both `staging` and `production` environments established.
- Codex is only allowed the staging token boundary.
- Production Railway tokens are intentionally withheld from Codex and remain isolated.

## Audit Conclusion

- The approved near-term path is documentation and operational clarity only.
- Password reset remains email-first.
- Any future privileged reset automation must stay server-side and secret-safe.
- Production Railway credentials remain outside Codex scope.
