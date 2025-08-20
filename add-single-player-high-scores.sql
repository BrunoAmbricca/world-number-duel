-- Add single-player high scores table
CREATE TABLE single_player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  high_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- Index for performance
CREATE INDEX idx_single_player_scores_player ON single_player_scores(player_id);
CREATE INDEX idx_single_player_scores_score ON single_player_scores(high_score DESC);

-- Add RLS policies (Row Level Security)
ALTER TABLE single_player_scores ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (since we're using session-based player IDs)
CREATE POLICY "Allow all operations on single_player_scores" ON single_player_scores
FOR ALL USING (true);