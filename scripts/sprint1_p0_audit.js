const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');

const required = ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_URL', 'SUPABASE_SECRET', 'DATABASE_URL', 'SUPABASE_PROJECT_REF'];

for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET;
const databaseUrl = process.env.DATABASE_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const outputDir = path.join(process.cwd(), 'sprint1-artifacts');

function redactConnectionString(value) {
  return value.replace(/:[^:@/]+@/, ':***@');
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

async function run() {
  const projectList = await fetchJson('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const targetProject = (projectList.body || []).find((project) => project.ref === projectRef);

  const poolerConfig = await fetchJson(`https://api.supabase.com/v1/projects/${projectRef}/config/database/pooler`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const postgresConfig = await fetchJson(`https://api.supabase.com/v1/projects/${projectRef}/config/database/postgres`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const apiKeys = await fetchJson(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const pooler = Array.isArray(poolerConfig.body) ? poolerConfig.body[0] : null;
  const anonKey = Array.isArray(apiKeys.body)
    ? apiKeys.body.find((key) => key.id === 'anon' || key.type === 'publishable' || key.name === 'anon')
    : null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const queries = {
    tables: `
      select
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as force_rls
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
      order by c.relname
    `,
    policies: `
      select
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      from pg_policies
      where schemaname = 'public'
      order by tablename, policyname
    `,
    functions: `
      select
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_userbyid(p.proowner) as owner,
        p.prosecdef as security_definer,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
      order by p.proname
    `,
    triggers: `
      select
        n.nspname as schema_name,
        c.relname as table_name,
        t.tgname as trigger_name,
        pg_get_triggerdef(t.oid, true) as trigger_def
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal
        and n.nspname not in ('pg_catalog', 'information_schema')
      order by n.nspname, c.relname, t.tgname
    `,
    grants: `
      select
        table_name,
        grantee,
        string_agg(privilege_type, ', ' order by privilege_type) as privileges
      from information_schema.role_table_grants
      where table_schema = 'public'
      group by table_name, grantee
      order by table_name, grantee
    `,
    routineGrants: `
      select
        routine_name,
        grantee,
        string_agg(privilege_type, ', ' order by privilege_type) as privileges
      from information_schema.routine_privileges
      where routine_schema = 'public'
      group by routine_name, grantee
      order by routine_name, grantee
    `,
    metrics: `
      select
        (select count(*) from public.organizations) as organization_count,
        (select count(*) from public.projects) as project_count,
        (select count(*) from public.projects where org_id is null) as projects_with_null_org_id,
        (select count(*) from public.profiles) as profile_count
    `,
    sampleOrg: `
      select id::text as id
      from public.organizations
      order by created_at
      limit 1
    `,
  };

  const snapshot = {};
  for (const [key, sql] of Object.entries(queries)) {
    const result = await client.query(sql);
    snapshot[key] = result.rows;
  }
  await client.end();

  const sampleOrgId = snapshot.sampleOrg[0]?.id || null;

  async function smoke(name, endpoint, options = {}) {
    const res = await fetch(`${supabaseUrl}${endpoint}`, options);
    const text = await res.text();
    return {
      name,
      endpoint,
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 200),
    };
  }

  const serviceHeaders = {
    apikey: supabaseSecret,
    Authorization: `Bearer ${supabaseSecret}`,
  };

  const anonHeaders = anonKey?.api_key
    ? {
        apikey: anonKey.api_key,
        Authorization: `Bearer ${anonKey.api_key}`,
      }
    : null;

  const smokeTests = [];
  smokeTests.push(await smoke('public-root', '/'));
  smokeTests.push(await smoke('protected-no-auth', '/rest/v1/projects?select=id,org_id&limit=1'));
  smokeTests.push(
    await smoke('protected-with-service-auth', '/rest/v1/projects?select=id,org_id&limit=1', {
      headers: serviceHeaders,
    })
  );
  smokeTests.push(
    await smoke('missing-x-organization-id', '/rest/v1/projects?select=id,org_id&limit=1', {
      headers: serviceHeaders,
    })
  );
  smokeTests.push(
    await smoke('invalid-x-organization-id', '/rest/v1/projects?select=id,org_id&limit=1', {
      headers: { ...serviceHeaders, 'x-organization-id': '00000000-0000-0000-0000-000000000000' },
    })
  );

  if (sampleOrgId) {
    smokeTests.push(
      await smoke('valid-x-organization-id', '/rest/v1/projects?select=id,org_id&limit=1', {
        headers: { ...serviceHeaders, 'x-organization-id': sampleOrgId },
      })
    );
  }

  if (anonHeaders && sampleOrgId) {
    smokeTests.push(
      await smoke('anon-project-read', '/rest/v1/projects?select=id,org_id&limit=1', {
        headers: anonHeaders,
      })
    );
    smokeTests.push(
      await smoke('anon-profile-read', '/rest/v1/profiles?select=id,email&limit=1', {
        headers: anonHeaders,
      })
    );
    smokeTests.push(
      await smoke('anon-rpc-get-org-usage', '/rest/v1/rpc/get_org_usage', {
        method: 'POST',
        headers: { ...anonHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ org_uuid: sampleOrgId }),
      })
    );
  }

  const output = {
    generatedAt: new Date().toISOString(),
    project: targetProject
      ? {
          ref: targetProject.ref,
          name: targetProject.name,
          status: targetProject.status,
          region: targetProject.region,
          databaseHost: targetProject.database?.host || null,
          databaseVersion: targetProject.database?.version || null,
          postgresEngine: targetProject.database?.postgres_engine || null,
        }
      : null,
    databaseConfig: {
      postgresStatus: postgresConfig.status,
      poolerStatus: poolerConfig.status,
      pooler: pooler
        ? {
            dbHost: pooler.db_host,
            dbPort: pooler.db_port,
            dbName: pooler.db_name,
            dbUser: pooler.db_user,
            poolMode: pooler.pool_mode,
            connectionString: redactConnectionString(pooler.connection_string),
          }
        : null,
    },
    apiKeys: Array.isArray(apiKeys.body)
      ? apiKeys.body.map((key) => ({
          id: key.id,
          type: key.type,
          name: key.name,
          prefix: key.prefix,
          description: key.description || null,
        }))
      : [],
    snapshot,
    smokeTests,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'supabase_sprint1_snapshot.json'), JSON.stringify(output, null, 2));

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputPath: path.join(outputDir, 'supabase_sprint1_snapshot.json'),
        tables: snapshot.tables.length,
        policies: snapshot.policies.length,
        triggers: snapshot.triggers.length,
        smokeTests: smokeTests.length,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
