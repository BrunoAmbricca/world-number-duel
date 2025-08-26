-- Add difficulty scaling support to multiplayer matches
-- Run this SQL in your Supabase SQL Editor to add difficulty tracking

-- Add difficulty columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS sequence_length INTEGER DEFAULT 5;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS display_interval INTEGER DEFAULT 1000; -- milliseconds
ALTER TABLE matches ADD COLUMN IF NOT EXISTS last_difficulty_type TEXT CHECK (last_difficulty_type IN ('sequence', 'timing', null));

-- Add completed_rounds column to track difficulty scaling
ALTER TABLE matches ADD COLUMN IF NOT EXISTS completed_rounds INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN matches.sequence_length IS 'Current sequence length for difficulty scaling (starts at 5)';
COMMENT ON COLUMN matches.display_interval IS 'Current display interval in milliseconds (starts at 1000, minimum 500)';
COMMENT ON COLUMN matches.last_difficulty_type IS 'Type of last difficulty increase: sequence, timing, or null';
COMMENT ON COLUMN matches.completed_rounds IS 'Number of rounds completed by both players for difficulty scaling';

-- Create function to calculate multiplayer difficulty settings
CREATE OR REPLACE FUNCTION calculate_multiplayer_difficulty(completed_rounds INTEGER)
RETURNS TABLE(
  sequence_length INTEGER,
  display_interval INTEGER,
  last_difficulty_type TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  base_sequence_length CONSTANT INTEGER := 5;
  base_interval CONSTANT INTEGER := 1000; -- 1 second
  min_interval CONSTANT INTEGER := 500;   -- 0.5 seconds minimum
  
  result_sequence_length INTEGER := base_sequence_length;
  result_display_interval INTEGER := base_interval;
  result_last_difficulty_type TEXT := NULL;
  
  difficulty_increments INTEGER;
  i INTEGER;
  can_decrease_timing BOOLEAN;
  should_increase_sequence BOOLEAN;
BEGIN
  -- Calculate how many difficulty increases have occurred
  -- Every 3 rounds starting from round 3
  difficulty_increments := FLOOR(completed_rounds / 3);
  
  IF difficulty_increments = 0 THEN
    sequence_length := result_sequence_length;
    display_interval := result_display_interval;
    last_difficulty_type := result_last_difficulty_type;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Apply difficulty increases alternately, but only sequence after min interval
  FOR i IN 0..(difficulty_increments - 1) LOOP
    can_decrease_timing := result_display_interval > min_interval;
    should_increase_sequence := (i % 2 = 0) OR NOT can_decrease_timing;
    
    IF should_increase_sequence THEN
      result_sequence_length := result_sequence_length + 1;
      result_last_difficulty_type := 'sequence';
    ELSE
      result_display_interval := GREATEST(min_interval, result_display_interval - 100); -- Decrease by 0.1s
      result_last_difficulty_type := 'timing';
    END IF;
  END LOOP;
  
  sequence_length := result_sequence_length;
  display_interval := result_display_interval;
  last_difficulty_type := result_last_difficulty_type;
  
  RETURN NEXT;
  RETURN;
END;
$$;

-- Create function to update match difficulty
CREATE OR REPLACE FUNCTION update_match_difficulty(match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  match_record RECORD;
  difficulty_record RECORD;
BEGIN
  -- Get current match data
  SELECT * INTO match_record FROM matches WHERE id = match_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', match_id;
  END IF;
  
  -- Calculate new difficulty based on completed rounds
  SELECT * INTO difficulty_record FROM calculate_multiplayer_difficulty(match_record.completed_rounds);
  
  -- Update match with new difficulty settings
  UPDATE matches 
  SET 
    sequence_length = difficulty_record.sequence_length,
    display_interval = difficulty_record.display_interval,
    last_difficulty_type = difficulty_record.last_difficulty_type,
    updated_at = NOW()
  WHERE id = match_id;
END;
$$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_matches_difficulty ON matches(completed_rounds, sequence_length, display_interval);

SELECT 'Multiplayer difficulty scaling schema updated successfully!' as status;