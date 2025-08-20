-- Run this SQL in your Supabase SQL Editor to set up the database schema

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS match_rounds;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS matchmaking_queue;

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id TEXT NOT NULL,
  player2_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  winner_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_round INTEGER DEFAULT 1,
  current_turn TEXT
);

-- Match rounds table
CREATE TABLE match_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  sequence JSONB NOT NULL,
  target_sum INTEGER NOT NULL,
  player1_answer JSONB,
  player2_answer JSONB,
  player1_correct BOOLEAN,
  player2_correct BOOLEAN,
  player1_submitted_at TIMESTAMP WITH TIME ZONE,
  player2_submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matchmaking queue table
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- Indexes for performance
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_match_rounds_match ON match_rounds(match_id, round_number);
CREATE INDEX idx_queue_joined_at ON matchmaking_queue(joined_at);

-- Insert some test data
INSERT INTO matchmaking_queue (player_id) VALUES ('test-setup');
DELETE FROM matchmaking_queue WHERE player_id = 'test-setup';

SELECT 'Database setup completed successfully!' as status;