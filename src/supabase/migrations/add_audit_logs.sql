-- Run in the existing Supabase project's SQL Editor, then retry the backup.
BEGIN;
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

REVOKE ALL ON public.audit_logs FROM anon;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
