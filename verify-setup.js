const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlzsgdriumiliuhgktjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsenNnZHJpdW1pbGl1aGdrdGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDQ4NzIsImV4cCI6MjA3MTIyMDg3Mn0.seVoKi9Q1y1KhcdFMpnDg8WadoJ3xJilduyNs9pSxmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Test each table
    console.log('📋 Checking tables...');
    
    const matchesTest = await supabase.from('matches').select('count', { count: 'exact', head: true });
    const queueTest = await supabase.from('matchmaking_queue').select('count', { count: 'exact', head: true });
    const roundsTest = await supabase.from('match_rounds').select('count', { count: 'exact', head: true });
    
    if (matchesTest.error || queueTest.error || roundsTest.error) {
      console.log('❌ Tables not found or not accessible');
      console.log('Errors:');
      if (matchesTest.error) console.log('  - matches:', matchesTest.error.message);
      if (queueTest.error) console.log('  - matchmaking_queue:', queueTest.error.message);
      if (roundsTest.error) console.log('  - match_rounds:', roundsTest.error.message);
      console.log('\n💡 Please run the SQL setup script in your Supabase dashboard first.');
      return false;
    }
    
    console.log('✅ All tables verified!');
    console.log(`📊 Current state:`);
    console.log(`   - Matches: ${matchesTest.count || 0}`);
    console.log(`   - Queue entries: ${queueTest.count || 0}`);
    console.log(`   - Rounds: ${roundsTest.count || 0}`);
    
    // Test API endpoint
    console.log('\n🔌 Testing API endpoint...');
    const testResponse = await fetch('http://localhost:3001/api/matchmaking/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 'test-verify' })
    });
    
    const testResult = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ API endpoint working!');
      console.log('Response:', testResult);
      
      // Clean up test entry
      await supabase.from('matchmaking_queue').delete().eq('player_id', 'test-verify');
      console.log('🧹 Cleaned up test entry');
      
      console.log('\n🎮 Ready for multiplayer simulation!');
      console.log('Run: node test-multiplayer.js --run');
      return true;
    } else {
      console.log('❌ API endpoint error:', testResult);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Use fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

verifySetup();