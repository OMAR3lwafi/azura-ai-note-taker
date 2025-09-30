-- Enhanced Arabic full-text search with pg_trgm
-- Based on: PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md
-- Priority: Production Gap #4 (Arabic Search Indexing)

-- Create optimized search function for Arabic text
CREATE OR REPLACE FUNCTION search_segments_arabic(
  p_user_id UUID,
  p_query TEXT,
  p_meeting_id UUID DEFAULT NULL,
  p_language TEXT DEFAULT 'ar',
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  meeting_id UUID,
  speaker_label TEXT,
  text TEXT,
  start_ms INT,
  end_ms INT,
  rank REAL,
  trigram_similarity REAL,
  combined_score REAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    s.id,
    s.meeting_id,
    s.speaker_label,
    s.text,
    s.start_ms,
    s.end_ms,
    ts_rank(s.text_search, query) AS rank,
    similarity(s.text, p_query) AS trigram_similarity,
    -- Combined score: weighted average of tsvector rank and trigram similarity
    (ts_rank(s.text_search, query) * 0.6 + similarity(s.text, p_query) * 0.4) AS combined_score
  FROM segments s
  CROSS JOIN to_tsquery('simple', unaccent(p_query)) AS query
  INNER JOIN meetings m ON m.id = s.meeting_id
  WHERE m.owner_id = p_user_id
    AND (p_meeting_id IS NULL OR s.meeting_id = p_meeting_id)
    AND (p_language IS NULL OR s.lang = p_language)
    AND (
      -- Full-text search match
      s.text_search @@ query
      OR
      -- Trigram fuzzy match (threshold 0.3 for Arabic)
      similarity(s.text, p_query) > 0.3
    )
  ORDER BY combined_score DESC, s.start_ms ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION search_segments_arabic IS 'Hybrid search combining tsvector and trigram matching for Arabic text';

-- Create hybrid search function (semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search_segments(
  p_user_id UUID,
  p_query TEXT,
  p_query_embedding VECTOR(384),
  p_meeting_id UUID DEFAULT NULL,
  p_semantic_weight FLOAT DEFAULT 0.7,
  p_keyword_weight FLOAT DEFAULT 0.3,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  meeting_id UUID,
  text TEXT,
  start_ms INT,
  end_ms INT,
  semantic_score FLOAT,
  keyword_score FLOAT,
  combined_score FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    s.id,
    s.meeting_id,
    s.text,
    s.start_ms,
    s.end_ms,
    (1 - (s.embedding <=> p_query_embedding)) AS semantic_score,
    (ts_rank(s.text_search, to_tsquery('simple', unaccent(p_query))) * 10) AS keyword_score,
    (
      (p_semantic_weight * (1 - (s.embedding <=> p_query_embedding))) +
      (p_keyword_weight * ts_rank(s.text_search, to_tsquery('simple', unaccent(p_query))))
    ) AS combined_score
  FROM segments s
  INNER JOIN meetings m ON m.id = s.meeting_id
  WHERE m.owner_id = p_user_id
    AND (p_meeting_id IS NULL OR s.meeting_id = p_meeting_id)
    AND s.embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION hybrid_search_segments IS 'Hybrid search combining semantic (vector) and keyword (tsvector) matching';

-- Create function to search across all meetings
CREATE OR REPLACE FUNCTION search_all_meetings(
  p_user_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  meeting_id UUID,
  title TEXT,
  started_at TIMESTAMPTZ,
  match_count BIGINT,
  best_match_text TEXT,
  best_match_score REAL
)
LANGUAGE SQL
STABLE
AS $$
  WITH ranked_segments AS (
    SELECT 
      s.meeting_id,
      s.text,
      (ts_rank(s.text_search, query) * 0.6 + similarity(s.text, p_query) * 0.4) AS score,
      ROW_NUMBER() OVER (PARTITION BY s.meeting_id ORDER BY (ts_rank(s.text_search, query) * 0.6 + similarity(s.text, p_query) * 0.4) DESC) as rn
    FROM segments s
    CROSS JOIN to_tsquery('simple', unaccent(p_query)) AS query
    INNER JOIN meetings m ON m.id = s.meeting_id
    WHERE m.owner_id = p_user_id
      AND (
        s.text_search @@ query
        OR similarity(s.text, p_query) > 0.3
      )
  ),
  match_counts AS (
    SELECT 
      meeting_id,
      COUNT(*) as match_count,
      MAX(score) as best_score
    FROM ranked_segments
    GROUP BY meeting_id
  )
  SELECT 
    m.id AS meeting_id,
    m.title,
    m.started_at,
    mc.match_count,
    rs.text AS best_match_text,
    rs.score AS best_match_score
  FROM meetings m
  INNER JOIN match_counts mc ON mc.meeting_id = m.id
  INNER JOIN ranked_segments rs ON rs.meeting_id = m.id AND rs.rn = 1
  WHERE m.owner_id = p_user_id
  ORDER BY mc.best_score DESC, mc.match_count DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION search_all_meetings IS 'Search across all meetings and return ranked results with match counts';

-- Create function for autocomplete/suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_user_id UUID,
  p_prefix TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  frequency BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    word,
    COUNT(*) as frequency
  FROM (
    SELECT DISTINCT unnest(string_to_array(lower(s.text), ' ')) as word
    FROM segments s
    INNER JOIN meetings m ON m.id = s.meeting_id
    WHERE m.owner_id = p_user_id
      AND s.text ILIKE p_prefix || '%'
      AND length(unnest(string_to_array(lower(s.text), ' '))) > 2
  ) words
  WHERE word LIKE p_prefix || '%'
  GROUP BY word
  ORDER BY frequency DESC, word ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_search_suggestions IS 'Generate autocomplete suggestions based on user search history';

-- Create materialized view for common search terms (optional, for analytics)
CREATE MATERIALIZED VIEW IF NOT EXISTS search_term_frequency AS
SELECT 
  m.owner_id,
  unnest(string_to_array(lower(s.text), ' ')) as term,
  COUNT(*) as frequency,
  s.lang
FROM segments s
INNER JOIN meetings m ON m.id = s.meeting_id
WHERE length(unnest(string_to_array(lower(s.text), ' '))) > 2
GROUP BY m.owner_id, term, s.lang;

CREATE INDEX IF NOT EXISTS idx_search_term_frequency_owner 
  ON search_term_frequency(owner_id, frequency DESC);

CREATE INDEX IF NOT EXISTS idx_search_term_frequency_term 
  ON search_term_frequency(term, owner_id);

COMMENT ON MATERIALIZED VIEW search_term_frequency IS 'Pre-computed term frequencies for search analytics';

-- Function to refresh search term frequency (run periodically)
CREATE OR REPLACE FUNCTION refresh_search_analytics()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY search_term_frequency;
END;
$$;

COMMENT ON FUNCTION refresh_search_analytics IS 'Refresh search analytics materialized view (run via cron)';
