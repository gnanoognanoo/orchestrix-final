-- Migration for Orchestrix Secret Features Phase 2 (Roadmap)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  foundational_papers JSONB,
  gap_areas JSONB,
  next_queries JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional index for faster session filtering
CREATE INDEX IF NOT EXISTS idx_roadmaps_session_id ON roadmaps(session_id);
