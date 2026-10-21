import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('API migration preserves RLS, blocks anonymous private reads and prevents signup role escalation', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid, email text, raw_user_meta_data jsonb);
      CREATE TABLE profiles(id uuid PRIMARY KEY, username text, name text, email text, role text, course text, enrolled text);
      CREATE TABLE courses(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title text);
      CREATE POLICY own_profile ON profiles FOR SELECT TO authenticated USING (id = current_setting('app.user_id')::uuid);
      CREATE POLICY public_catalog ON courses FOR SELECT USING (true);
      INSERT INTO courses(title) VALUES ('Catalog');
    `);
    const migration = await readFile(new URL('../src/supabase/migrations/harden_api_access.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    await db.exec(`CREATE TRIGGER signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001', 'student@example.com', '{"role":"admin"}');`);
    assert.equal((await db.query('SELECT role FROM profiles')).rows[0].role, 'student');
    await db.exec(`SET ROLE anon`);
    assert.equal((await db.query('SELECT * FROM courses')).rows.length, 1);
    await assert.rejects(db.query('SELECT * FROM profiles'), /permission denied/);
    await assert.rejects(db.query("INSERT INTO courses(title) VALUES ('Bad')"), /permission denied/);
    await db.exec(`RESET ROLE; SET ROLE authenticated; SET app.user_id = '00000000-0000-4000-8000-000000000001'`);
    assert.equal((await db.query('SELECT * FROM profiles')).rows.length, 1);
    await assert.rejects(db.query("INSERT INTO courses(title) VALUES ('Bad')"), /row-level security/);
  } finally { await db.close(); }
});
