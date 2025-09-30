-- Migration: Add unique constraint for segments deduplication
-- This prevents duplicate segments on webhook retries or multiple ingests

-- Add unique constraint on segments table
-- Combination of meeting_id, speaker_label, start_ms, and end_ms should be unique
ALTER TABLE segments 
ADD CONSTRAINT segments_unique_key 
UNIQUE (meeting_id, speaker_label, start_ms, end_ms);

-- Create index to support the constraint efficiently
CREATE INDEX IF NOT EXISTS idx_segments_unique 
ON segments (meeting_id, speaker_label, start_ms, end_ms);

-- Comment for documentation
COMMENT ON CONSTRAINT segments_unique_key ON segments IS 
'Ensures no duplicate segments for the same meeting, speaker, and time window. Supports upsert operations on webhook retries.';
