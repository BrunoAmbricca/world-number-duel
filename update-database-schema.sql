-- Update database schema for proper multiplayer game mechanics
-- Run this in your Supabase SQL Editor

-- First, let's alter the existing table to match single-player game mechanics
ALTER TABLE match_rounds 
  RENAME COLUMN target_sum TO correct_sum;

-- Change player answers to store the sum (integer) instead of selected numbers (JSONB)
ALTER TABLE match_rounds 
  ALTER COLUMN player1_answer TYPE INTEGER USING (player1_answer::text::integer),
  ALTER COLUMN player2_answer TYPE INTEGER USING (player2_answer::text::integer);

-- Test the changes
SELECT 'Database schema updated for single-player game mechanics!' as status;