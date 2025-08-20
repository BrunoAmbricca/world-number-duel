const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlzsgdriumiliuhgktjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsenNnZHJpdW1pbGl1aGdrdGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDQ4NzIsImV4cCI6MjA3MTIyMDg3Mn0.seVoKi9Q1y1KhcdFMpnDg8WadoJ3xJilduyNs9pSxmk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Testing database connection and creating tables...');

async function setupTables() {
  try {
    // Test basic connection
    console.log('📡 Testing Supabase connection...');
    
    // Try to query a system table to test connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.log('ℹ️  Direct table query failed (expected), trying RPC approach...');
    } else {
      console.log('✅ Direct connection successful');
    }

    // Let's try creating a simple test to see if we can insert data
    console.log('🔧 Testing table creation...');
    
    // Create a simple test table first
    const createTestTable = `
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT
      );
    `;
    
    console.log('Database setup requires SQL execution in Supabase dashboard.');
    console.log('Please run the SQL in setup-database.sql in your Supabase SQL editor.');
    
    // Test if tables exist by trying a simple query
    console.log('🔍 Checking if tables exist...');
    
    const testMatches = await supabase.from('matches').select('count', { count: 'exact', head: true });
    const testQueue = await supabase.from('matchmaking_queue').select('count', { count: 'exact', head: true });
    const testRounds = await supabase.from('match_rounds').select('count', { count: 'exact', head: true });
    
    if (!testMatches.error && !testQueue.error && !testRounds.error) {
      console.log('✅ All required tables exist!');
      console.log(`📊 Current state:`);
      console.log(`   - Matches: ${testMatches.count || 0}`);
      console.log(`   - Queue entries: ${testQueue.count || 0}`);
      console.log(`   - Rounds: ${testRounds.count || 0}`);
      return true;
    } else {
      console.log('❌ Tables not found. Please run setup-database.sql in Supabase SQL editor.');
      console.log('Errors:', { 
        matches: testMatches.error?.message,
        queue: testQueue.error?.message,
        rounds: testRounds.error?.message
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

setupTables();