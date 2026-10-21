# Supabase remediation

1. In the LMS project (noppclbjtifbsargdqsr), save a database backup, then run src/supabase/migrations/harden_api_access.sql in SQL Editor. This migration is repeatable and assumes existing LMS schema/policies. It enables RLS on known LMS tables, grants explicit API privileges, and forces new signup profiles to student. Existing admins keep their roles. It does not repair missing or overly permissive existing policies.
2. Run src/supabase/security_audit.sql on each project mentioned in the emails. The security warning named a different project. Review every flagged table and all policies permitting anonymous access or unrestricted student access. Do not run the entire schema.sql against an existing database: it includes non-repeatable policy creation.
3. Deploy the frontend changes. The admin username alias uses VITE_ADMIN_EMAIL, defaulting to the seeded email. Email login still works directly. Fallback UI profiles no longer trust metadata for admin roles.
4. Change the seeded admin password in Supabase Authentication and review profiles with role = 'admin'. Remove any unexpected admin role only after verifying the account owner. Existing roles are not changed automatically.
5. To prevent automatic inactivity pauses, move the production project's organization to a paid plan. Free projects remain subject to inactivity pausing; no application code guarantees prevention. Confirm billing yourself before upgrading.
6. For every future table, enable RLS, define policies and add explicit table/sequence grants in the migration that creates it. Existing-table grants do not automatically cover future tables.

Local verification covers anonymous access denial, RLS enforcement, repeatable application and signup metadata escalation. A full live security review, applying SQL, deployment and billing changes remain separate operational steps.
