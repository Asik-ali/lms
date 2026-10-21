-- Read-only: run on EACH project listed in security emails.
-- Any returned row needs review. No rows does not certify all policies are safe.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon', c.oid, 'SELECT') AS anonymous_read,
       has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE') AS anonymous_write
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  AND (NOT c.relrowsecurity OR has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE'))
ORDER BY c.relname;

-- Inspect policies, especially USING (true) on student/private data.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
