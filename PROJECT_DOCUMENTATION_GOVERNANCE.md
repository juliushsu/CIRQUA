# Project Documentation Governance

Generated: 2026-04-29

Status:
- active governance rule for this repository
- applies to all future CTO, architecture, audit, sprint, migration, and baseline documentation work

## 1. Required Documentation Locations

All CTO / architecture / audit / sprint / migration / baseline files must live inside this repository under one of these directories:

- `docs/cto/`
- `docs/audits/`
- `docs/sprints/`
- `docs/migrations/`

Rule:
- documentation must be committed into the repo
- documentation must not exist only as a local machine path
- ad hoc root-level documentation is no longer the preferred pattern for new work

## 2. Local-Only Documentation Is Not Allowed

Rule:
- no authoritative documentation may exist only on a local filesystem path
- every authoritative document must be stored in Git in this repository

Prohibited state:
- file exists locally but is not added to repo
- file is referenced only by local path in conversation but not committed

Required state:
- file exists in repo
- file is committed
- file is pushed to GitHub

## 3. Required Completion Steps For Every Document

After completing any governance-covered document, the following are mandatory:

1. commit
2. push
3. report GitHub URL
4. report commit hash

Completion is not considered done until all four steps are complete.

## 4. Required Project Anchor Documents

Every project must maintain these three anchor documents:

- `PROJECT_BOUNDARY.md`
- `SUPABASE_BASELINE.md`
- `CURRENT_SPRINT.md`

Rule:
- these files must exist in the repo
- they must be kept current enough to support project-boundary verification before work starts

## 5. Mandatory Pre-Work Boundary Check

Before starting any implementation, audit, sprint, migration, or architecture task, verify all of the following:

- repo path
- git remote
- Supabase project ref
- expected tables
- forbidden foreign-schema tables

Minimum expected behavior:
- if any item is missing, inconsistent, or points to another project, stop and re-verify
- do not continue based on assumption alone

## 6. Boundary Mismatch Stop Rule

If the prompt or requested work is inconsistent with the current project boundary:

- stop
- report the boundary mismatch clearly
- do not create migrations
- do not invent schema
- do not continue with cross-project assumptions

Special rule:
- if foreign-schema contamination is suspected, treat the request as blocked until project identity is re-confirmed

## 7. Operating Rule For This Repo

From this point forward, work in this repository should follow this order:

1. verify project boundary
2. confirm anchor documentation
3. create or update governed document in repo
4. commit
5. push
6. report GitHub URL and commit hash

## 8. Enforcement Intent

This governance exists to prevent:

- local-only documentation drift
- undocumented project switching
- Supabase project confusion
- foreign-schema contamination
- unreviewed migration creation under boundary mismatch

