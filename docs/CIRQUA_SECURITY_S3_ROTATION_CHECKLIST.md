# CIRQUA Security S3 Rotation Checklist

## Scope

This checklist documents user-confirmed security and credential-handling constraints for CIRQUA S3 rotation planning. It is documentation-only and does not authorize or perform any live credential rotation.

## Guardrails

- Do not execute live rotation from this repository.
- Do not add any real password to documentation, code, or git history.
- Do not add or expose any `service_role` secret.
- Do not work on `main`; use a non-`main` working branch for documentation updates.

## S3 User-Confirmed Constraints

- Password reset path: Supabase Dashboard email reset first.
- Optional future path: server-side admin password reset script only.
- Owner account: `juliushsu@gmail.com`.
- Railway token boundary: Codex staging only, production isolated.

## Rotation Notes

### 1. Supabase password reset handling

- The current manual reset path is sending a password reset email from the Supabase dashboard/backend flow.
- Do not assume the Supabase Dashboard supports directly editing a user's password as an approved operational path.
- Do not document any direct password replacement workflow as the default process.

### 2. Future bulk reset boundary

- If batch password reset is needed in the future, the only acceptable design is a server-side admin script.
- That script must use `service_role` in a protected server environment to call the Supabase Auth Admin API `updateUserById`.
- The script must not run in the frontend.
- The `service_role` secret must not be committed to git.

### 3. Owner account handling

- `juliushsu@gmail.com` is the owner account referenced for this flow.
- The intended purpose of that owner account is for the user to enter the system and review or correct their own data.

### 4. Railway environment boundary

- Railway has separate `staging` and `production` environments.
- Codex is only provided the staging token boundary.
- Production tokens are not provided to Codex and must remain isolated from this workflow.

## Operational Status

- This document records constraints only.
- No reset email was triggered here.
- No password was generated here.
- No token or secret was rotated here.
