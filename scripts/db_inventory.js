const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET;

if (!connectionString && !(supabaseUrl && supabaseSecret)) {
  console.error('Provide DATABASE_URL or SUPABASE_URL + SUPABASE_SECRET');
  process.exit(1);
}

const outputDir = path.join(process.cwd(), 'db-inventory');
const markdownPath = path.join(outputDir, 'supabase-database-inventory.md');
const jsonPath = path.join(outputDir, 'supabase-database-inventory.json');

function toMarkdown(summary) {
  const lines = [];
  lines.push('# CIRQUA Database Inventory');
  lines.push('');
  lines.push(`Generated at: ${summary.generatedAt}`);
  lines.push(`Host: ${summary.host}`);
  lines.push(`Database: ${summary.database}`);
  lines.push(`Inventory mode: ${summary.inventoryMode}`);
  if (summary.version) {
    lines.push(`PostgreSQL version: ${summary.version}`);
  }
  if (summary.connectionTest) {
    lines.push(`Connection test: ${summary.connectionTest}`);
  }
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Schemas: ${summary.schemas.length}`);
  lines.push(`- Tables: ${summary.tableCount}`);
  lines.push(`- Views: ${summary.viewCount}`);
  lines.push(`- Functions: ${summary.functionCount}`);
  lines.push('');

  for (const schema of summary.schemas) {
    lines.push(`## Schema: ${schema.name}`);
    lines.push('');
    lines.push(`- Tables: ${schema.tables.length}`);
    lines.push(`- Views: ${schema.views.length}`);
    lines.push(`- Functions: ${schema.functions.length}`);
    lines.push('');

    if (schema.tables.length) {
      lines.push('### Tables');
      lines.push('');
      for (const table of schema.tables) {
        lines.push(`#### ${table.name}`);
        lines.push('');
        lines.push(`- Type: ${table.tableType}`);
        lines.push(`- Estimated rows: ${table.estimatedRows}`);
        lines.push(`- Columns: ${table.columns.length}`);
        if (table.primaryKey.length) {
          lines.push(`- Primary key: ${table.primaryKey.join(', ')}`);
        }
        if (table.rlsEnabled !== null) {
          lines.push(`- RLS enabled: ${table.rlsEnabled ? 'yes' : 'no'}`);
        }
        lines.push('');
        lines.push('| Column | Data Type | Nullable | Default |');
        lines.push('| --- | --- | --- | --- |');
        for (const column of table.columns) {
          lines.push(
            `| ${column.name} | ${column.dataType} | ${column.isNullable ? 'YES' : 'NO'} | ${column.defaultValue || ''} |`
          );
        }
        lines.push('');
      }
    }

    if (schema.views.length) {
      lines.push('### Views');
      lines.push('');
      for (const view of schema.views) {
        lines.push(`- ${view.name}`);
      }
      lines.push('');
    }

    if (schema.functions.length) {
      lines.push('### Functions');
      lines.push('');
      for (const fn of schema.functions) {
        lines.push(`- ${fn.name}(${fn.arguments}) -> ${fn.returnType}`);
      }
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function buildSummary({
  version = null,
  host,
  database,
  inventoryMode,
  connectionTest,
  schemas,
  tables,
  columns,
  primaryKeys,
  views,
  functions,
}) {
  return {
    generatedAt: new Date().toISOString(),
    host,
    database,
    version,
    inventoryMode,
    connectionTest,
    tableCount: tables.filter((t) => t.table_type === 'BASE TABLE').length,
    viewCount: views.length,
    functionCount: functions.length,
    schemas: schemas.map((schemaName) => {
      const schemaTables = tables
        .filter((t) => t.schema_name === schemaName && t.table_type === 'BASE TABLE')
        .map((table) => ({
          name: table.table_name,
          tableType: table.table_type,
          estimatedRows: String(table.estimated_rows ?? 'n/a'),
          rlsEnabled: table.rls_enabled ?? null,
          primaryKey: primaryKeys
            .filter((pk) => pk.schema_name === schemaName && pk.table_name === table.table_name)
            .map((pk) => pk.column_name),
          columns: columns
            .filter((column) => column.schema_name === schemaName && column.table_name === table.table_name)
            .map((column) => ({
              name: column.column_name,
              dataType: column.data_type,
              isNullable: column.is_nullable,
              defaultValue: column.column_default,
            })),
        }));

      return {
        name: schemaName,
        tables: schemaTables,
        views: views
          .filter((view) => view.schema_name === schemaName)
          .map((view) => ({ name: view.table_name })),
        functions: functions
          .filter((fn) => fn.schema_name === schemaName)
          .map((fn) => ({
            name: fn.function_name,
            arguments: fn.arguments,
            returnType: fn.return_type,
          })),
      };
    }),
  };
}

async function inventoryViaDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const [{ server_version: version }] = (await client.query('show server_version')).rows;

  const schemas = (
    await client.query(`
      select schema_name
      from information_schema.schemata
      where schema_name not in ('information_schema')
        and schema_name not like 'pg_toast%'
        and schema_name not like 'pg_temp_%'
      order by schema_name
    `)
  ).rows.map((row) => row.schema_name);

  const tables = (
    await client.query(`
      select
        t.table_schema as schema_name,
        t.table_name,
        t.table_type,
        coalesce(c.reltuples::bigint, 0) as estimated_rows,
        coalesce(cls.relrowsecurity, false) as rls_enabled
      from information_schema.tables t
      left join pg_class cls on cls.relname = t.table_name
      left join pg_namespace ns on ns.oid = cls.relnamespace and ns.nspname = t.table_schema
      left join pg_class c on c.oid = cls.oid
      where t.table_schema not in ('information_schema')
        and t.table_schema not like 'pg_toast%'
        and t.table_schema not like 'pg_temp_%'
      order by t.table_schema, t.table_name
    `)
  ).rows;

  const columns = (
    await client.query(`
      select
        table_schema as schema_name,
        table_name,
        column_name,
        data_type,
        is_nullable = 'YES' as is_nullable,
        column_default
      from information_schema.columns
      where table_schema not in ('information_schema')
        and table_schema not like 'pg_toast%'
        and table_schema not like 'pg_temp_%'
      order by table_schema, table_name, ordinal_position
    `)
  ).rows;

  const primaryKeys = (
    await client.query(`
      select
        tc.table_schema as schema_name,
        tc.table_name,
        kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema = kcu.table_schema
       and tc.table_name = kcu.table_name
      where tc.constraint_type = 'PRIMARY KEY'
      order by tc.table_schema, tc.table_name, kcu.ordinal_position
    `)
  ).rows;

  const views = (
    await client.query(`
      select table_schema as schema_name, table_name
      from information_schema.views
      where table_schema not in ('information_schema')
        and table_schema not like 'pg_toast%'
        and table_schema not like 'pg_temp_%'
      order by table_schema, table_name
    `)
  ).rows;

  const functions = (
    await client.query(`
      select
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname not in ('information_schema')
        and n.nspname not like 'pg_toast%'
        and n.nspname not like 'pg_temp_%'
      order by n.nspname, p.proname
    `)
  ).rows;

  await client.end();

  return buildSummary({
    version,
    host: new URL(connectionString).hostname,
    database: new URL(connectionString).pathname.replace(/^\//, ''),
    inventoryMode: 'postgres',
    connectionTest: 'Postgres direct connection succeeded',
    schemas,
    tables,
    columns,
    primaryKeys,
    views,
    functions,
  });
}

async function inventoryViaRest(dbError) {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseSecret,
      Authorization: `Bearer ${supabaseSecret}`,
    },
  });

  if (!response.ok) {
    throw new Error(`REST inventory failed: ${response.status}`);
  }

  const spec = await response.json();
  const paths = Object.keys(spec.paths || {}).filter((key) => key !== '/');
  const definitions = spec.definitions || {};
  const tables = [];
  const columns = [];

  for (const rawPath of paths) {
    const tableName = rawPath.replace(/^\//, '');
    const definition = definitions[tableName];
    if (!definition || !definition.properties) {
      continue;
    }

    tables.push({
      schema_name: 'public',
      table_name: tableName,
      table_type: 'BASE TABLE',
      estimated_rows: 'n/a',
      rls_enabled: null,
    });

    const required = new Set(definition.required || []);
    for (const [columnName, columnDef] of Object.entries(definition.properties)) {
      columns.push({
        schema_name: 'public',
        table_name: tableName,
        column_name: columnName,
        data_type: columnDef.format || columnDef.type || 'unknown',
        is_nullable: !required.has(columnName),
        column_default: null,
      });
    }
  }

  return buildSummary({
    host: new URL(supabaseUrl).hostname,
    database: 'postgres',
    inventoryMode: 'supabase-rest-openapi',
    connectionTest: `REST API succeeded; Postgres direct connection failed (${dbError})`,
    schemas: ['public'],
    tables,
    columns,
    primaryKeys: [],
    views: [],
    functions: [],
  });
}

async function main() {
  let summary;
  let dbError = null;

  if (connectionString) {
    try {
      summary = await inventoryViaDatabase();
    } catch (error) {
      dbError = error.message;
    }
  }

  if (!summary) {
    if (!(supabaseUrl && supabaseSecret)) {
      throw new Error(dbError || 'No available inventory method');
    }
    summary = await inventoryViaRest(dbError || 'not attempted');
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2));
  await fs.writeFile(markdownPath, toMarkdown(summary));

  console.log(
    JSON.stringify(
      {
        ok: true,
        markdownPath,
        jsonPath,
        inventoryMode: summary.inventoryMode,
        connectionTest: summary.connectionTest,
        schemas: summary.schemas.length,
        tables: summary.tableCount,
        views: summary.viewCount,
        functions: summary.functionCount,
      },
      null,
      2
    )
  );
}

main().catch(async (error) => {
  console.error(error.message);
  process.exit(1);
});
