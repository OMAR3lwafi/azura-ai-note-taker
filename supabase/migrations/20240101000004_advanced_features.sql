-- Advanced features: API keys, integrations, device tracking, RPC functions

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL UNIQUE,
  name text NOT NULL,
  scopes text[] DEFAULT ARRAY['read']::text[],
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE is_active = true;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- TOTP secrets table
CREATE TABLE IF NOT EXISTS totp_secrets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret text NOT NULL,
  backup_codes text[],
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own TOTP" ON totp_secrets FOR ALL USING (auth.uid() = user_id);

-- Device tracking table
CREATE TABLE IF NOT EXISTS auth_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id text NOT NULL,
  platform text NOT NULL,
  user_agent text,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_auth_devices_user_id ON auth_devices(user_id);

ALTER TABLE auth_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON auth_devices FOR SELECT USING (auth.uid() = user_id);

-- Integration settings table
CREATE TABLE IF NOT EXISTS integration_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  access_token text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_integration_settings_user_id ON integration_settings(user_id);

ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations" ON integration_settings FOR ALL USING (auth.uid() = user_id);

-- RPC: Calculate talk time for speakers
CREATE OR REPLACE FUNCTION calculate_talk_time(p_meeting_id uuid)
RETURNS TABLE(speaker_label text, total_talk_time_ms bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.speaker_label,
    SUM(s.end_ms - s.start_ms) AS total_talk_time_ms
  FROM segments s
  WHERE s.meeting_id = p_meeting_id
  GROUP BY s.speaker_label
  ORDER BY total_talk_time_ms DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Semantic search using pgvector
CREATE OR REPLACE FUNCTION search_segments_semantic(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  meeting_id uuid,
  text text,
  speaker_label text,
  start_ms bigint,
  end_ms bigint,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.meeting_id,
    s.text,
    s.speaker_label,
    s.start_ms,
    s.end_ms,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM segments s
  INNER JOIN meetings m ON s.meeting_id = m.id
  WHERE 
    s.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR m.owner_id = filter_user_id)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Trigram search
CREATE OR REPLACE FUNCTION search_segments_trigram(
  search_query text,
  similarity_threshold float DEFAULT 0.3,
  filter_user_id uuid DEFAULT NULL,
  filter_meeting_id uuid DEFAULT NULL,
  result_limit int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  meeting_id uuid,
  text text,
  speaker_label text,
  start_ms bigint,
  end_ms bigint,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.meeting_id,
    s.text,
    s.speaker_label,
    s.start_ms,
    s.end_ms,
    similarity(s.text, search_query) AS similarity
  FROM segments s
  INNER JOIN meetings m ON s.meeting_id = m.id
  WHERE 
    similarity(s.text, search_query) > similarity_threshold
    AND (filter_user_id IS NULL OR m.owner_id = filter_user_id)
    AND (filter_meeting_id IS NULL OR s.meeting_id = filter_meeting_id)
  ORDER BY similarity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_talk_time TO authenticated;
GRANT EXECUTE ON FUNCTION search_segments_semantic TO authenticated;
GRANT EXECUTE ON FUNCTION search_segments_trigram TO authenticated;

-- Comments
COMMENT ON TABLE api_keys IS 'User API keys for programmatic access';
COMMENT ON TABLE totp_secrets IS 'TOTP 2FA secrets and backup codes';
COMMENT ON TABLE auth_devices IS 'Device tracking for sessions';
COMMENT ON TABLE integration_settings IS 'Third-party integration credentials';
COMMENT ON FUNCTION calculate_talk_time IS 'Calculate total talk time per speaker';
COMMENT ON FUNCTION search_segments_semantic IS 'Semantic search using embeddings';
COMMENT ON FUNCTION search_segments_trigram IS 'Fuzzy search using trigrams';
