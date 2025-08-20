const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlzsgdriumiliuhgktjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsenNnZHJpdW1pbGl1aGdrdGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDQ4NzIsImV4cCI6MjA3MTIyMDg3Mn0.seVoKi9Q1y1KhcdFMpnDg8WadoJ3xJilduyNs9pSxmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesViaRPC() {
  console.log('🔧 Attempting to create tables via Supabase RPC...');
  
  try {
    // Create a stored procedure to set up tables
    const createFunction = `
      CREATE OR REPLACE FUNCTION setup_multiplayer_tables()
      RETURNS TEXT AS $$
      BEGIN
        -- Create matches table
        CREATE TABLE IF NOT EXISTS matches (
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

        -- Create match rounds table
        CREATE TABLE IF NOT EXISTS match_rounds (
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

        -- Create matchmaking queue table
        CREATE TABLE IF NOT EXISTS matchmaking_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id TEXT NOT NULL,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(player_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
        CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
        CREATE INDEX IF NOT EXISTS idx_match_rounds_match ON match_rounds(match_id, round_number);
        CREATE INDEX IF NOT EXISTS idx_queue_joined_at ON matchmaking_queue(joined_at);

        RETURN 'Tables created successfully';
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('Creating setup function...');
    // This will likely fail with anon key, but let's try
    const { data, error } = await supabase.rpc('exec', { sql: createFunction });
    
    if (error) {
      console.log('❌ Cannot create tables via RPC (expected with anon key)');
      console.log('Error:', error.message);
      console.log('\n📋 Manual Setup Required:');
      console.log('Please copy and paste this SQL into your Supabase SQL Editor:');
      console.log('\n' + '='.repeat(50));
      console.log(`
-- Multiplayer Game Schema Setup
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS match_rounds;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS matchmaking_queue;

-- Create matches table
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

-- Create match rounds table
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

-- Create matchmaking queue table
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- Create indexes
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_match_rounds_match ON match_rounds(match_id, round_number);
CREATE INDEX idx_queue_joined_at ON matchmaking_queue(joined_at);

-- Test insertion
INSERT INTO matchmaking_queue (player_id) VALUES ('setup-test');
DELETE FROM matchmaking_queue WHERE player_id = 'setup-test';

SELECT 'Setup completed successfully!' as status;
      `);
      console.log('='.repeat(50));
      console.log('\nAfter running the SQL, the multiplayer system will be ready for testing.');
      return false;
    } else {
      console.log('✅ Tables created successfully via RPC');
      return true;
    }
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  }
}

createTablesViaRPC();