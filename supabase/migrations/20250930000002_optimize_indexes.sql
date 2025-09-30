-- Optimize vector and full-text search indexes
-- Based on: PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md

-- Add trigram extension if not exists (for fuzzy Arabic search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing indexes to recreate with optimal settings
DROP INDEX IF EXISTS idx_segments_embedding;
DROP INDEX IF EXISTS idx_segments_text_search;

-- Recreate IVFFlat index with optimized lists parameter
-- Formula: lists = sqrt(total_rows)
-- This will need adjustment as data grows:
-- - <10K rows: lists = 100
-- - 10K-100K rows: lists = 316
-- - 100K-1M rows: lists = 1000
CREATE INDEX idx_segments_embedding ON segments 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Recreate GIN index for full-text search
CREATE INDEX idx_segments_text_search ON segments 
  USING GIN (text_search);

-- Add trigram index for fuzzy matching (especially useful for Arabic)
CREATE INDEX idx_segments_text_trigram ON segments 
  USING GIN (text gin_trgm_ops);

-- Add composite index for common query pattern (meeting + time ordering)
CREATE INDEX IF NOT EXISTS idx_segments_meeting_time 
  ON segments(meeting_id, start_ms);

-- Add index on language for language-specific queries
CREATE INDEX IF NOT EXISTS idx_segments_lang 
  ON segments(lang);

-- Optimize meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_owner_started 
  ON meetings(owner_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_meetings_tags 
  ON meetings USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_meetings_project 
  ON meetings(project) WHERE project IS NOT NULL;

-- Optimize ai_suggestions access
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_meeting 
  ON ai_suggestions(meeting_id, created_at DESC);

-- Optimize tasks access
CREATE INDEX IF NOT EXISTS idx_tasks_meeting 
  ON tasks(meeting_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON tasks(status) WHERE status IS NOT NULL;

-- Update statistics for query planner
ANALYZE segments;
ANALYZE meetings;
ANALYZE ai_suggestions;
ANALYZE tasks;

-- Set maintenance work mem for better index builds (session-level)
SET maintenance_work_mem = '256MB';

-- Function to check index usage (for monitoring)
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT,
    tablename::TEXT,
    indexname::TEXT,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_index_usage() IS 'Monitor index usage to identify unused indexes';

-- Function to get table and index sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  tablename TEXT,
  row_count BIGINT,
  total_size TEXT,
  table_size TEXT,
  indexes_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    (SELECT COUNT(*) FROM (SELECT 1 FROM ONLY pg_catalog.pg_class WHERE relname = t.tablename LIMIT 1) s) AS row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.tablename)::regclass)) AS total_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.tablename)::regclass)) AS table_size,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.tablename)::regclass) - pg_relation_size(quote_ident(t.tablename)::regclass)) AS indexes_size
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY pg_total_relation_size(quote_ident(t.tablename)::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_table_sizes() IS 'Monitor table and index sizes for capacity planning';
