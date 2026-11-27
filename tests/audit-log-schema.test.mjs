import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { fetchBackup } from '../api/backup.mjs';

test('audit log migration is repeatable and permits backups and admin reads while blocking students and anonymous users', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql
        AS $$ SELECT coalesce(current_setting('app.admin', true), '') = 'true' $$;
    `);
    const sql = await readFile(new URL('../src/supabase/migrations/add_audit_logs.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(`INSERT INTO public.audit_logs(username,user_role,action,entity,description)
      VALUES ('Admin','admin','update','courses','Course updated');`);
    await db.exec(sql);
    await db.exec('SET ROLE service_role');
    assert.equal((await db.query('SELECT * FROM public.audit_logs')).rows.length, 1);
    await db.exec('RESET ROLE; SET ROLE authenticated');
    assert.equal((await db.query('SELECT * FROM public.audit_logs')).rows.length, 0);
    await assert.rejects(db.query(`INSERT INTO public.audit_logs(username,user_role,action,entity,description)
      VALUES ('Student','student','update','courses','Forbidden')`), /row-level security/);
    await db.exec("SET app.admin = 'true'");
    assert.equal((await db.query('SELECT * FROM public.audit_logs')).rows.length, 1);
    await db.exec('RESET ROLE; SET ROLE anon');
    await assert.rejects(db.query('SELECT * FROM public.audit_logs'), /permission denied/);
  } finally { await db.close(); }
});

test('missing audit log table gives an actionable error instead of silently omitting data', async () => {
  const client = { from(table) { return {
    select() { return this; }, order() { return this; }, async range() {
      return table === 'audit_logs' ? { error: { code: 'PGRST205', message: 'Table not found' } } : { data: [] };
    },
  }; } };
  const backup = await fetchBackup(client);
  assert.match(backup.tables.audit_logs.__error, /add_audit_logs.sql/);
  assert.ok(Array.isArray(backup.tables.courses));
});
