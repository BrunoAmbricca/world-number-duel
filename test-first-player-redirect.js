const { createClient } = require('@supabase/supabase-js');

// Use fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const supabaseUrl = 'https://wlzsgdriumiliuhgktjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsenNnZHJpdW1pbGl1aGdrdGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDQ4NzIsImV4cCI6MjA3MTIyMDg3Mn0.seVoKi9Q1y1KhcdFMpnDg8WadoJ3xJilduyNs9pSxmk';
const apiBase = 'http://localhost:3001/api';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test players
const player1 = { id: 'player001', name: 'Alice' };
const player2 = { id: 'player002', name: 'Bob' };

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${apiBase}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testFirstPlayerRedirect() {
  console.log('🧪 Testing First Player Redirect Issue');
  console.log('=====================================');

  // Clean up any existing data
  try {
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    console.log('🧹 Cleaned up existing queue entries');
  } catch (error) {
    console.log('ℹ️  Queue cleanup skipped');
  }

  console.log(`\n📋 Scenario:`);
  console.log(`1. ${player1.name} joins queue and waits`);
  console.log(`2. ${player2.name} joins queue and creates match`);
  console.log(`3. Both players should be redirected to game`);
  console.log(`\n🔍 Expected: ${player1.name} receives Pusher notification and gets redirected`);

  // Step 1: Player 1 joins queue
  console.log(`\n👤 Step 1: ${player1.name} joining queue...`);
  const joinResult1 = await apiCall('/matchmaking/join', 'POST', { playerId: player1.id });
  
  if (!joinResult1.success) {
    console.error(`❌ ${player1.name} failed to join queue:`, joinResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} in queue:`, joinResult1.data);
  
  if (joinResult1.data.matched) {
    console.log('❌ Unexpected: Player 1 was immediately matched (should wait)');
    return;
  }

  // Verify player 1 is in database queue
  const { data: queueCheck } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('player_id', player1.id);
  
  if (queueCheck && queueCheck.length > 0) {
    console.log(`✅ Verified: ${player1.name} is in database queue`);
  } else {
    console.log(`❌ Issue: ${player1.name} not found in database queue`);
    return;
  }

  // Wait a moment to simulate real user behavior
  await sleep(2000);

  // Step 2: Player 2 joins queue (should create match and trigger Pusher)
  console.log(`\n👤 Step 2: ${player2.name} joining queue (should create match)...`);
  const joinResult2 = await apiCall('/matchmaking/join', 'POST', { playerId: player2.id });
  
  if (!joinResult2.success) {
    console.error(`❌ ${player2.name} failed to join queue:`, joinResult2.data);
    return;
  }
  
  console.log(`✅ ${player2.name} response:`, joinResult2.data);

  if (!joinResult2.data.matched) {
    console.log('❌ Issue: No match was created when second player joined');
    return;
  }

  const matchId = joinResult2.data.matchId;
  console.log(`🎯 Match created: ${matchId}`);

  // Step 3: Check if Pusher notification was sent
  console.log(`\n📡 Step 3: Checking server logs for Pusher notification...`);
  
  // In a real test, we'd check browser console logs or use Pusher's debug console
  // For now, let's verify the match was created properly
  const matchCheck = await apiCall(`/matches/${matchId}`);
  
  if (matchCheck.success) {
    const match = matchCheck.data.match;
    console.log(`✅ Match verified in database:`);
    console.log(`   - Player 1: ${match.player1_id}`);
    console.log(`   - Player 2: ${match.player2_id}`);
    console.log(`   - Status: ${match.status}`);
    console.log(`   - Current Turn: ${match.current_turn}`);
  } else {
    console.log(`❌ Failed to verify match: ${matchCheck.data}`);
  }

  // Step 4: Test manual Pusher notification
  console.log(`\n🧪 Step 4: Testing manual Pusher notification to ${player1.name}...`);
  
  const pusherTest = await apiCall('/test-pusher', 'POST', { playerId: player1.id });
  
  if (pusherTest.success) {
    console.log(`✅ Manual Pusher test sent:`, pusherTest.data);
  } else {
    console.log(`❌ Manual Pusher test failed:`, pusherTest.data);
  }

  // Step 5: Check final queue state
  console.log(`\n🔍 Step 5: Checking final queue state...`);
  
  const { data: finalQueue } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .in('player_id', [player1.id, player2.id]);
  
  if (!finalQueue || finalQueue.length === 0) {
    console.log(`✅ Both players removed from queue (expected)`);
  } else {
    console.log(`⚠️  Players still in queue:`, finalQueue.map(p => p.player_id));
  }

  console.log(`\n📋 Summary:`);
  console.log(`✅ Match creation: Working`);
  console.log(`✅ Database updates: Working`);
  console.log(`❓ Pusher notification: Check browser console for real test`);
  console.log(`❓ Frontend redirect: Check browser for real test`);
  
  console.log(`\n💡 To test the full flow:`);
  console.log(`1. Open http://localhost:3001 in two browser tabs`);
  console.log(`2. Start sessions and go to queue in both tabs`);
  console.log(`3. Join queue in first tab (should show "waiting")`);
  console.log(`4. Join queue in second tab (should create match)`);
  console.log(`5. Check if first tab gets redirected automatically`);
  
  console.log(`\n🔧 If first player doesn't get redirected, check:`);
  console.log(`- Browser console for Pusher connection logs`);
  console.log(`- Browser console for "Match found event received" message`);
  console.log(`- Network tab for Pusher WebSocket connection`);
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

// Run the test
if (process.argv.includes('--run')) {
  testFirstPlayerRedirect()
    .then(() => cleanup())
    .catch(async (error) => {
      console.error('❌ Test failed:', error);
      await cleanup();
      process.exit(1);
    });
} else {
  console.log('Use: node test-first-player-redirect.js --run');
  console.log('Make sure the Next.js server is running on localhost:3001');
}