# CIRQUA Database Inventory

Generated at: 2026-04-28T02:01:33.528Z
Host: pzidyucjmlivbwlbyckh.supabase.co
Database: postgres
Inventory mode: supabase-rest-openapi
Connection test: REST API succeeded; Postgres direct connection failed (getaddrinfo ENOTFOUND db.pzidyucjmlivbwlbyckh.supabase.co)

## Summary

- Schemas: 1
- Tables: 14
- Views: 0
- Functions: 0

## Schema: public

- Tables: 14
- Views: 0
- Functions: 0

### Tables

#### income_categories

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 7

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | NO |  |
| name | text | NO |  |
| color | text | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### receipts

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 14

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | YES |  |
| title | text | NO |  |
| amount | numeric | NO |  |
| date | date | NO |  |
| vendor | text | YES |  |
| category | text | YES |  |
| status | text | NO |  |
| file_url | text | YES |  |
| notes | text | YES |  |
| uploaded_by | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### project_members

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 8

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| project_id | text | NO |  |
| user_id | uuid | NO |  |
| role | text | NO |  |
| department | text | YES |  |
| joined_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### expense_categories

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 9

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | NO |  |
| name | text | NO |  |
| budget | numeric | NO |  |
| spent | numeric | NO |  |
| color | text | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### profiles

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 22

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| email | text | NO |  |
| name | text | NO |  |
| avatar | text | YES |  |
| role | text | NO |  |
| department | text | YES |  |
| phone | text | YES |  |
| id_number | text | YES |  |
| bank_account | text | YES |  |
| bank_name | text | YES |  |
| created_at | timestamp with time zone | YES |  |
| updated_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |
| level | text | YES |  |
| is_active | boolean | YES |  |
| emergency_contact_name | text | YES |  |
| emergency_contact_relationship | text | YES |  |
| emergency_contact_phone | text | YES |  |
| bank_branch | text | YES |  |
| bank_account_holder | text | YES |  |
| admin_level | text | YES |  |

#### forms

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 11

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | YES |  |
| name | text | NO |  |
| type | text | NO |  |
| status | text | NO |  |
| data | jsonb | NO |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| updated_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### activity_logs

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 8

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | YES |  |
| user_id | uuid | NO |  |
| action | text | NO |  |
| details | text | YES |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### legal_documents

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 18

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | YES |  |
| title | text | NO |  |
| type | text | NO |  |
| file_url | text | NO |  |
| uploaded_by | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |
| status | text | NO |  |
| signing_date | date | YES |  |
| expiry_date | date | YES |  |
| parties | jsonb | YES |  |
| amount | numeric | YES |  |
| currency | text | YES |  |
| notes | text | YES |  |
| version | text | YES |  |
| effective_date | date | YES |  |

#### income_records

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 11

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | NO |  |
| category_id | text | NO |  |
| amount | numeric | NO |  |
| date | date | NO |  |
| description | text | YES |  |
| source | text | YES |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### expense_records

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 12

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | NO |  |
| category_id | text | NO |  |
| amount | numeric | NO |  |
| date | date | NO |  |
| description | text | YES |  |
| vendor | text | YES |  |
| receipt_id | text | YES |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### projects

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 19

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| name | text | NO |  |
| description | text | YES |  |
| status | text | NO |  |
| budget | numeric | NO |  |
| spent | numeric | NO |  |
| start_date | date | YES |  |
| end_date | date | YES |  |
| owner_id | uuid | NO |  |
| created_at | timestamp with time zone | YES |  |
| updated_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |
| base_currency | text | NO |  |
| currency | text | NO |  |
| type | text | NO |  |
| project_manager_id | uuid | YES |  |
| closed_at | timestamp with time zone | YES |  |
| org_id | uuid | YES |  |

#### organizations

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 17

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| name | character varying | NO |  |
| tax_id | character varying | YES |  |
| address | text | YES |  |
| phone | character varying | YES |  |
| email | character varying | YES |  |
| plan_type | character varying | YES |  |
| max_projects | integer | YES |  |
| max_members | integer | YES |  |
| max_storage_mb | integer | YES |  |
| is_active | boolean | YES |  |
| subscription_start_date | date | YES |  |
| subscription_end_date | date | YES |  |
| data_source | character varying | YES |  |
| seed_batch_id | character varying | YES |  |
| created_at | timestamp with time zone | YES |  |
| updated_at | timestamp with time zone | YES |  |

#### alerts

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 10

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |
| project_id | text | NO |  |
| type | text | NO |  |
| severity | text | NO |  |
| title | text | NO |  |
| message | text | NO |  |
| is_read | boolean | YES |  |
| created_at | timestamp with time zone | YES |  |
| data_source | text | YES |  |
| seed_batch_id | text | YES |  |

#### org_members

- Type: BASE TABLE
- Estimated rows: n/a
- Columns: 9

| Column | Data Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| org_id | uuid | NO |  |
| user_id | uuid | NO |  |
| org_role | character varying | NO |  |
| is_active | boolean | YES |  |
| joined_at | timestamp with time zone | YES |  |
| data_source | character varying | YES |  |
| seed_batch_id | character varying | YES |  |
| created_at | timestamp with time zone | YES |  |

