import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { isAnnouncementVisible } from '../src/data/announcementVisibility.js';

test('announcement audience helper excludes private, missing-audience and draft messages', () => {
 for (const target of ['All','Students',' students ']) assert.equal(isAnnouncementVisible({status:'Published',target}),true);
 for (const target of ['Admins','',null]) assert.equal(isAnnouncementVisible({status:'Published',target}),false);
 assert.equal(isAnnouncementVisible({status:'Draft',target:'All'}),false);
 assert.equal(isAnnouncementVisible({status:'Published',target:'Admins'},'instructor'),true);
});

test('announcement database policy blocks anonymous reads, student access to drafts and admin messages', async () => {
 const db = new PGlite();
 try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
   CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT current_setting('app.admin',true) = 'true' $$;
   CREATE TABLE announcements(id int,title text,target text,status text);
   ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
   GRANT SELECT ON announcements TO anon,authenticated;
   CREATE POLICY "Everyone can read announcements" ON announcements FOR SELECT USING (true);
   CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (public.is_admin());
   INSERT INTO announcements VALUES (1,'Public','All','Published'),(2,'Students','Students','Published'),(3,'Private','Admins','Published'),(4,'Draft','All','Draft');`);
  const sql = await readFile(new URL('../src/supabase/migrations/restrict_announcement_audience.sql',import.meta.url),'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec('SET ROLE anon');
  assert.equal((await db.query('SELECT * FROM announcements')).rows.length,0);
  await db.exec('RESET ROLE; SET ROLE authenticated');
  assert.deepEqual((await db.query('SELECT id FROM announcements ORDER BY id')).rows.map(row=>row.id),[1,2]);
  await db.exec("SET app.admin = 'true'");
  assert.equal((await db.query('SELECT * FROM announcements')).rows.length,4);
 } finally {await db.close();}
});
