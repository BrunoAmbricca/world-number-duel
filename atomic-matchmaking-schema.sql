-- Enhanced matchmaking schema with atomic operations and single-player-per-match enforcement
-- Run this SQL in your Supabase SQL Editor

-- Add a status column to the matchmaking_queue to prevent race conditions
ALTER TABLE matchmaking_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched'));

-- Ensure unique constraint on player_id (this should already exist but let's be explicit)
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matchmaking_queue_player_id_key' 
        AND table_name = 'matchmaking_queue'
    ) THEN
        -- Add unique constraint if it doesn't exist
        ALTER TABLE matchmaking_queue ADD CONSTRAINT matchmaking_queue_player_id_key UNIQUE (player_id);
    END IF;
END $$;

-- Add an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_queue_status ON matchmaking_queue(status, joined_at);

-- Update matches table to ensure proper status values
DO $$
BEGIN
    -- Check if we need to update the status constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%matches_status_check%'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
    END IF;
    
    -- Add updated constraint with 'finished' status
    ALTER TABLE matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('waiting', 'active', 'completed', 'abandoned', 'finished'));
END $$;

-- Add index for finding active matches by player
CREATE INDEX IF NOT EXISTS idx_matches_player_status ON matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(status) WHERE status = 'active';

-- Create the atomic matchmaking function with active match checking
CREATE OR REPLACE FUNCTION atomic_matchmaking(new_player_id TEXT)
RETURNS TABLE(
  matched BOOLEAN,
  match_id UUID,
  opponent_id TEXT,
  queue_id UUID,
  already_active BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
  waiting_player RECORD;
  existing_match RECORD;
  new_match_id UUID;
  new_queue_id UUID;
BEGIN
  -- First, check if player already has an active match (no lock needed for read)
  SELECT * INTO existing_match
  FROM matches 
  WHERE (player1_id = new_player_id OR player2_id = new_player_id) 
    AND status = 'active'
  LIMIT 1;
  
  IF existing_match IS NOT NULL THEN
    -- Player already has an active match, return that match
    matched := TRUE;
    match_id := existing_match.id;
    opponent_id := CASE 
      WHEN existing_match.player1_id = new_player_id THEN existing_match.player2_id
      ELSE existing_match.player1_id
    END;
    queue_id := NULL;
    already_active := TRUE;
    
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Lock both tables for this transaction to prevent race conditions
  LOCK TABLE matchmaking_queue IN EXCLUSIVE MODE;
  LOCK TABLE matches IN EXCLUSIVE MODE;
  
  -- Double-check active match after acquiring locks (race condition safety)
  SELECT * INTO existing_match
  FROM matches 
  WHERE (player1_id = new_player_id OR player2_id = new_player_id) 
    AND status = 'active'
  LIMIT 1;
  
  IF existing_match IS NOT NULL THEN
    -- Player got an active match between our checks, return that match
    matched := TRUE;
    match_id := existing_match.id;
    opponent_id := CASE 
      WHEN existing_match.player1_id = new_player_id THEN existing_match.player2_id
      ELSE existing_match.player1_id
    END;
    queue_id := NULL;
    already_active := TRUE;
    
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Try to find the oldest waiting player (excluding the new player)
  SELECT * INTO waiting_player 
  FROM matchmaking_queue 
  WHERE player_id != new_player_id 
    AND status = 'waiting'
  ORDER BY joined_at ASC 
  LIMIT 1
  FOR UPDATE;
  
  IF waiting_player IS NOT NULL THEN
    -- Found a match! Create the match record with initial difficulty settings
    INSERT INTO matches (player1_id, player2_id, status, current_turn, completed_rounds, sequence_length, display_interval, last_difficulty_type)
    VALUES (waiting_player.player_id, new_player_id, 'active', waiting_player.player_id, 0, 5, 1000, null)
    RETURNING id INTO new_match_id;
    
    -- Remove both players from the queue
    DELETE FROM matchmaking_queue 
    WHERE player_id IN (waiting_player.player_id, new_player_id);
    
    -- Return match details
    matched := TRUE;
    match_id := new_match_id;
    opponent_id := waiting_player.player_id;
    queue_id := NULL;
    already_active := FALSE;
    
  ELSE
    -- No match found, add player to queue (using INSERT ... ON CONFLICT for safety)
    INSERT INTO matchmaking_queue (player_id, status)
    VALUES (new_player_id, 'waiting')
    ON CONFLICT (player_id) DO UPDATE SET
      status = 'waiting',
      joined_at = NOW()
    RETURNING id INTO new_queue_id;
    
    -- Return queue details
    matched := FALSE;
    match_id := NULL;
    opponent_id := NULL;
    queue_id := new_queue_id;
    already_active := FALSE;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Create a function to clean up stale queue entries (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_stale_queue_entries()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove queue entries older than 5 minutes
  DELETE FROM matchmaking_queue 
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create a function to finish matches safely
CREATE OR REPLACE FUNCTION finish_match(
  match_uuid UUID,
  winner_player_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  match_exists BOOLEAN;
BEGIN
  -- Check if the match exists and is active
  SELECT EXISTS(
    SELECT 1 FROM matches 
    WHERE id = match_uuid AND status = 'active'
  ) INTO match_exists;
  
  IF NOT match_exists THEN
    RETURN FALSE; -- Match doesn't exist or is not active
  END IF;
  
  -- Update the match status to finished
  UPDATE matches 
  SET 
    status = 'finished',
    winner_id = winner_player_id,
    updated_at = NOW()
  WHERE id = match_uuid AND status = 'active';
  
  RETURN TRUE;
END;
$$;

-- Create a helper function to get player's active match
CREATE OR REPLACE FUNCTION get_player_active_match(player_uuid TEXT)
RETURNS TABLE(
  match_id UUID,
  opponent_id TEXT,
  is_player1 BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE 
      WHEN m.player1_id = player_uuid THEN m.player2_id
      ELSE m.player1_id
    END as opponent_id,
    (m.player1_id = player_uuid) as is_player1
  FROM matches m
  WHERE (m.player1_id = player_uuid OR m.player2_id = player_uuid)
    AND m.status = 'active'
  LIMIT 1;
END;
$$;

-- Grant execution permissions (adjust as needed for your setup)
-- GRANT EXECUTE ON FUNCTION atomic_matchmaking(TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION cleanup_stale_queue_entries() TO authenticated;
-- GRANT EXECUTE ON FUNCTION finish_match(UUID, TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_player_active_match(TEXT) TO authenticated;

SELECT 'Enhanced matchmaking schema with single-player-per-match enforcement updated successfully!' as status;