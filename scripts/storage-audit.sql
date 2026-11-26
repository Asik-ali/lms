-- Read-only audit. Run in Supabase SQL Editor; this does not delete data.
-- Table/index usage explains database growth independently of file storage.
SELECT relname AS table_name,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
       pg_size_pretty(pg_relation_size(relid)) AS data_size,
       n_live_tup AS estimated_rows,
       n_dead_tup AS estimated_deleted_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;

-- File storage usage by bucket.
SELECT bucket_id, count(*) AS files,
       pg_size_pretty(coalesce(sum((metadata->>'size')::bigint),0)) AS stored_bytes
FROM storage.objects GROUP BY bucket_id ORDER BY sum((metadata->>'size')::bigint) DESC NULLS LAST;

-- Largest stored files for manual review. Do not delete solely by age or size.
SELECT bucket_id, name, created_at,
       pg_size_pretty(coalesce((metadata->>'size')::bigint,0)) AS file_size
FROM storage.objects ORDER BY (metadata->>'size')::bigint DESC NULLS LAST LIMIT 50;
