# CIRQUA

This repository tracks the current CIRQUA Supabase database inventory for cross-project integration work.

## Current connection status

- Supabase project URL is reachable: `https://pzidyucjmlivbwlbyckh.supabase.co`
- Supabase REST/OpenAPI inventory works with the provided `sb_secret` key
- Direct Postgres connection using `db.pzidyucjmlivbwlbyckh.supabase.co` currently fails DNS resolution and should be rechecked in the Supabase dashboard before downstream integrations depend on it

## Inventory artifacts

- Markdown report: [db-inventory/supabase-database-inventory.md](db-inventory/supabase-database-inventory.md)
- JSON report: [db-inventory/supabase-database-inventory.json](db-inventory/supabase-database-inventory.json)
- Rebuild command:

```bash
DATABASE_URL='***' \
SUPABASE_URL='https://pzidyucjmlivbwlbyckh.supabase.co' \
SUPABASE_SECRET='***' \
node scripts/db_inventory.js
```

## Public schema tables

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
