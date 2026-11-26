-- Apply in Supabase SQL Editor. Only the admin-authenticated backup API can call this function.
CREATE OR REPLACE FUNCTION public.restore_lms_backup(p_backup jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  allowed text[] := ARRAY['profiles','courses','course_pdfs','course_lessons','test_series','test_categories','tests','assignments','assignment_submissions','quizzes','questions','attendance','announcements','enrollments','notifications','live_classes','smtp_settings','tickets','ticket_replies','calendar_events','test_attempts','test_responses','question_reports','sales_plans','sales_plan_items','purchase_orders','purchases','referral_settings','referral_codes','referrals'];
  export_only text[] := ARRAY['audit_logs','push_subscriptions','pending_signups','backup_log'];
  v_table text; rows_json jsonb; pk text; columns_sql text; updates_sql text; sequence_name text;
  restored jsonb := '{}'::jsonb; max_id bigint; prior_sequence bigint;
BEGIN
  IF p_backup->>'version' IS DISTINCT FROM '1' OR jsonb_typeof(p_backup->'tables') IS DISTINCT FROM 'object'
     OR (p_backup ? 'type' AND p_backup->>'type' <> 'lms-backup') OR p_backup->'tables' = '{}'::jsonb THEN
    RAISE EXCEPTION 'Invalid LMS backup';
  END IF;
  FOR v_table, rows_json IN SELECT key, value FROM jsonb_each(p_backup->'tables') LOOP
    IF NOT v_table = ANY(allowed || export_only) THEN RAISE EXCEPTION 'Unsupported backup table: %', v_table; END IF;
    IF jsonb_typeof(rows_json) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Incomplete backup table: %', v_table; END IF;
  END LOOP;
  FOREACH v_table IN ARRAY allowed LOOP
    rows_json := p_backup->'tables'->v_table;
    IF rows_json IS NULL OR rows_json = '[]'::jsonb THEN CONTINUE; END IF;
    pk := CASE WHEN v_table = 'referral_codes' THEN 'student_id' ELSE 'id' END;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(rows_json) row_value WHERE jsonb_typeof(row_value) <> 'object' OR row_value->>pk IS NULL) THEN
      RAISE EXCEPTION 'Original IDs are required for %', v_table;
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(rows_json) row_value, LATERAL jsonb_object_keys(row_value) field
      WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = v_table AND c.column_name = field)
    ) THEN RAISE EXCEPTION 'Backup contains unknown columns for %', v_table; END IF;
    SELECT string_agg(format('%I', a.attname), ',' ORDER BY a.attnum),
           string_agg(format('%I = EXCLUDED.%I', a.attname, a.attname), ',' ORDER BY a.attnum) FILTER (WHERE a.attname <> pk)
    INTO columns_sql, updates_sql FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', v_table)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '';
    EXECUTE format('INSERT INTO public.%1$I (%2$s) OVERRIDING SYSTEM VALUE SELECT %2$s FROM jsonb_populate_recordset(NULL::public.%1$I, $1) ON CONFLICT (%3$I) DO UPDATE SET %4$s', v_table, columns_sql, pk, updates_sql) USING rows_json;
    restored := restored || jsonb_build_object(v_table, jsonb_array_length(rows_json));
    IF pk = 'id' THEN
      sequence_name := pg_get_serial_sequence(format('public.%I', v_table), 'id');
      IF sequence_name IS NOT NULL THEN
        EXECUTE format('SELECT max(id) FROM public.%I', v_table) INTO max_id;
        EXECUTE format('SELECT last_value FROM %s', sequence_name::regclass) INTO prior_sequence;
        IF max_id IS NOT NULL THEN PERFORM pg_catalog.setval(sequence_name::regclass, greatest(max_id, prior_sequence), true); END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN restored;
END;
$$;
REVOKE ALL ON FUNCTION public.restore_lms_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_lms_backup(jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
