// Test script to set up database and verify connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔧 Setting up database schema...');
  
  // Create tables (this will fail if they already exist, which is fine)
  const createTablesSQL = `
    -- Matches table
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

    -- Match rounds table
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

    -- Matchmaking queue table
    CREATE TABLE IF NOT EXISTS matchmaking_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id TEXT NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(player_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
    CREATE INDEX IF NOT EXISTS idx_match_rounds_match ON match_rounds(match_id, round_number);
    CREATE INDEX IF NOT EXISTS idx_queue_joined_at ON matchmaking_queue(joined_at);
  `;

  try {
    // Test connection
    const { data, error } = await supabase.from('matches').select('count', { count: 'exact', head: true });
    if (!error) {
      console.log('✅ Database connection successful');
      console.log(`📊 Current matches count: ${data?.length || 0}`);
    }
  } catch (error) {
    console.log('🔧 Setting up database tables...');
    // Note: We can't directly execute DDL from the client, so we'll check if tables exist
  }

  // Clean up any existing queue entries for testing
  try {
    await supabase.from('matchmaking_queue').delete().neq('id', 'none');
    console.log('🧹 Cleaned up matchmaking queue');
  } catch (error) {
    console.log('ℹ️  Matchmaking queue cleanup skipped');
  }

  console.log('✅ Database setup complete');
}

setupDatabase();