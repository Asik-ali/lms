import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { validateBackup } from '../src/data/backup.js';
import { fetchBackup } from '../api/backup.mjs';

test('backup export fetches every page instead of truncating at the API row limit', async () => {
 const client = { from(table) { return { select() { return this; }, order() { return this; }, async range(from, to) {
  return {data: table === 'questions' ? Array.from({length:Math.max(0,Math.min(to + 1,1251)-from)},(_,i)=>({id:from+i+1})) : []};
 } }; } };
 const backup=await fetchBackup(client);
 assert.equal(backup.tables.questions.length,1251);
 assert.equal(backup.tables.questions[1250].id,1251);
});

test('backup validation rejects partial exports and missing original IDs',()=>{
 assert.throws(()=>validateBackup({version:1,tables:[]}),/valid LMS/);
 assert.throws(()=>validateBackup({version:1,tables:{courses:{__error:'timeout'}}}),/incomplete/);
 assert.throws(()=>validateBackup({version:1,tables:{courses:[{title:'Missing ID'}]}}),/IDs/);
 assert.throws(()=>validateBackup({version:1,tables:{unexpected:[]}}),/Unsupported/);
 assert.deepEqual(validateBackup({version:1,tables:{courses:[{id:10,title:'Course'}]}}),[{table:'courses',count:1}]);
});
test('atomic restore preserves IDs, relationships, unrelated rows and rolls back every table on failure',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
   CREATE TABLE courses(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,title text NOT NULL);
   CREATE TABLE questions(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,course_id bigint REFERENCES courses(id),question text NOT NULL);
   INSERT INTO courses(title) VALUES ('Existing');`);
  const migration=await readFile(new URL('../src/supabase/migrations/atomic_backup_restore.sql',import.meta.url),'utf8');
  await db.exec(migration);
  const backup={version:1,tables:{courses:[{id:10,title:'Restored'}],questions:[{id:20,course_id:10,question:'Question'}]}};
  await db.query('SELECT public.restore_lms_backup($1::jsonb)',[JSON.stringify(backup)]);
  assert.deepEqual((await db.query('SELECT id,title FROM courses ORDER BY id')).rows,[{id:1,title:'Existing'},{id:10,title:'Restored'}]);
  assert.equal((await db.query('SELECT course_id FROM questions')).rows[0].course_id,10);
  assert.equal((await db.query("INSERT INTO courses(title) VALUES ('New') RETURNING id")).rows[0].id,11);
  await assert.rejects(db.query('SELECT public.restore_lms_backup($1::jsonb)',[JSON.stringify({version:1,tables:{courses:[{id:10,title:'Must roll back'}],questions:[{id:21,course_id:999,question:'Broken FK'}]}})]));
  assert.equal((await db.query('SELECT title FROM courses WHERE id=10')).rows[0].title,'Restored');
  await db.exec('SET ROLE authenticated');
  await assert.rejects(db.query('SELECT public.restore_lms_backup($1::jsonb)',[JSON.stringify(backup)]),/permission denied/);
 }finally{await db.close();}
});
