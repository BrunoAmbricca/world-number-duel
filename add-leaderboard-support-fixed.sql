-- Leaderboard support migration (Fixed version)
-- This enhances the existing schema to support leaderboard functionality

-- First, ensure we have proper indexes for leaderboard queries on matches table
-- (Additional indexes for efficient leaderboard queries)

-- Index for weekly winners (matches by winner and date)
CREATE INDEX IF NOT EXISTS idx_matches_winner_date ON matches(winner_id, updated_at) 
WHERE status = 'completed' AND winner_id IS NOT NULL;

-- Index for daily winners (optimized for date range queries)
CREATE INDEX IF NOT EXISTS idx_matches_completed_date ON matches(updated_at, winner_id) 
WHERE status = 'completed' AND winner_id IS NOT NULL;

-- Create a view for easy access to match wins with dates
CREATE OR REPLACE VIEW match_wins AS
SELECT 
  winner_id as player_id,
  updated_at as win_date,
  DATE_TRUNC('day', updated_at) as win_day,
  DATE_TRUNC('week', updated_at) as win_week,
  id as match_id
FROM matches 
WHERE status = 'completed' 
  AND winner_id IS NOT NULL;

-- Create a function to get current week start (Monday 00:00 UTC)
CREATE OR REPLACE FUNCTION get_week_start(input_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN DATE_TRUNC('week', input_date AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to get current day start (00:00 UTC)
CREATE OR REPLACE FUNCTION get_day_start(input_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN DATE_TRUNC('day', input_date AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Drop existing materialized views if they exist (to recreate them properly)
DROP MATERIALIZED VIEW IF EXISTS weekly_leaderboard;
DROP MATERIALIZED VIEW IF EXISTS daily_leaderboard;

-- Create materialized view for weekly leaderboard (refreshed periodically for performance)
CREATE MATERIALIZED VIEW weekly_leaderboard AS
WITH weekly_wins AS (
  SELECT 
    player_id,
    COUNT(*) as wins,
    get_week_start() as week_start
  FROM match_wins 
  WHERE win_date >= get_week_start()
  GROUP BY player_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY wins DESC, player_id) as rank,
  player_id,
  wins as score,
  week_start
FROM weekly_wins
ORDER BY wins DESC, player_id;

-- Create materialized view for daily leaderboard
CREATE MATERIALIZED VIEW daily_leaderboard AS
WITH daily_wins AS (
  SELECT 
    player_id,
    COUNT(*) as wins,
    get_day_start() as day_start
  FROM match_wins 
  WHERE win_date >= get_day_start()
  GROUP BY player_id
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY wins DESC, player_id) as rank,
  player_id,
  wins as score,
  day_start
FROM daily_wins
ORDER BY wins DESC, player_id;

-- Create view for single-player historical leaderboard
CREATE OR REPLACE VIEW singleplayer_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY high_score DESC, player_id) as rank,
  player_id,
  high_score as score,
  updated_at as last_updated
FROM single_player_scores
ORDER BY high_score DESC, player_id;

-- Index for single-player leaderboard view
CREATE INDEX IF NOT EXISTS idx_single_player_scores_leaderboard 
ON single_player_scores(high_score DESC, player_id);

-- Create function to refresh leaderboard materialized views
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW weekly_leaderboard;
  REFRESH MATERIALIZED VIEW daily_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Set up RLS for materialized views
ALTER MATERIALIZED VIEW weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW daily_leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow read access on weekly_leaderboard" ON weekly_leaderboard;
DROP POLICY IF EXISTS "Allow read access on daily_leaderboard" ON daily_leaderboard;

-- Policies for leaderboard access (allow read access for all)
CREATE POLICY "Allow read access on weekly_leaderboard" ON weekly_leaderboard
FOR SELECT USING (true);

CREATE POLICY "Allow read access on daily_leaderboard" ON daily_leaderboard
FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON match_wins TO anon, authenticated;
GRANT SELECT ON weekly_leaderboard TO anon, authenticated;
GRANT SELECT ON daily_leaderboard TO anon, authenticated;
GRANT SELECT ON singleplayer_leaderboard TO anon, authenticated;

-- Initial refresh of materialized views
SELECT refresh_leaderboards();

-- Add helpful comments
COMMENT ON VIEW match_wins IS 'View providing easy access to match wins with time-based grouping';
COMMENT ON MATERIALIZED VIEW weekly_leaderboard IS 'Weekly multiplayer wins leaderboard - refreshed periodically';
COMMENT ON MATERIALIZED VIEW daily_leaderboard IS 'Daily multiplayer wins leaderboard - refreshed periodically';
COMMENT ON VIEW singleplayer_leaderboard IS 'Single-player historical rounds leaderboard - real-time view';
COMMENT ON FUNCTION refresh_leaderboards() IS 'Refreshes leaderboard materialized views. Should be called periodically via scheduled task.';