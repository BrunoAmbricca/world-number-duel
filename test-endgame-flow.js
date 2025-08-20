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
const player1 = { id: 'test-player-1', name: 'Alice' };
const player2 = { id: 'test-player-2', name: 'Bob' };

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

async function testEndGameFlow() {
  console.log('🧪 Testing End-Game Flow');
  console.log('========================');

  // Clean up any existing data
  try {
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    console.log('🧹 Cleaned up existing queue entries');
  } catch (error) {
    console.log('ℹ️  Queue cleanup skipped');
  }

  console.log(`\n📋 Test scenario:`);
  console.log(`1. Create match between ${player1.name} and ${player2.name}`);
  console.log(`2. ${player1.name} submits CORRECT answer`);
  console.log(`3. ${player2.name} submits WRONG answer`);
  console.log(`4. Verify match completion and winner determination`);
  console.log(`5. Test frontend redirect to result page`);

  // Step 1: Create match
  console.log(`\n👤 Step 1: ${player1.name} joining queue...`);
  const joinResult1 = await apiCall('/matchmaking/join', 'POST', { playerId: player1.id });
  
  if (!joinResult1.success) {
    console.error(`❌ ${player1.name} failed to join queue:`, joinResult1.data);
    return;
  }

  console.log(`\n👤 Step 2: ${player2.name} joining queue...`);
  const joinResult2 = await apiCall('/matchmaking/join', 'POST', { playerId: player2.id });
  
  if (!joinResult2.success || !joinResult2.data.matched) {
    console.error(`❌ Match creation failed:`, joinResult2.data);
    return;
  }

  const matchId = joinResult2.data.matchId;
  console.log(`🎯 Match created: ${matchId}`);

  await sleep(1000);

  // Step 2: Get match details
  console.log(`\n📋 Step 3: Getting match details...`);
  const matchResult = await apiCall(`/matches/${matchId}`);
  
  if (!matchResult.success) {
    console.error('❌ Failed to get match details:', matchResult.data);
    return;
  }
  
  const match = matchResult.data.match;
  const currentRound = matchResult.data.currentRound;
  
  console.log(`📊 Match Status: ${match.status}`);
  console.log(`🎯 Current Round: ${match.current_round}`);
  console.log(`🎲 Sequence: [${currentRound.sequence.join(', ')}]`);
  console.log(`🎯 Correct Sum: ${currentRound.correct_sum}`);

  // Step 3: Both players submit answers (one correct, one wrong)
  console.log(`\n🎮 Step 4: Testing end-game scenario...`);
  
  // Player 1 submits correct answer
  console.log(`\n👤 ${player1.name} submitting CORRECT answer: ${currentRound.correct_sum}`);
  const submitResult1 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player1.id,
    answer: currentRound.correct_sum
  });
  
  if (!submitResult1.success) {
    console.error(`❌ ${player1.name} failed to submit:`, submitResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} submitted correctly`);

  await sleep(1000);

  // Player 2 submits wrong answer
  const wrongAnswer = currentRound.correct_sum + 10;
  console.log(`\n👤 ${player2.name} submitting WRONG answer: ${wrongAnswer}`);
  
  const submitResult2 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player2.id,
    answer: wrongAnswer
  });
  
  if (!submitResult2.success) {
    console.error(`❌ ${player2.name} failed to submit:`, submitResult2.data);
    return;
  }
  
  console.log(`✅ ${player2.name} submitted incorrectly`);
  console.log(`📧 Backend should have sent Pusher 'round-completed' event`);

  await sleep(2000);

  // Step 4: Verify match completion
  console.log(`\n🏆 Step 5: Verifying match completion...`);
  const finalMatchResult = await apiCall(`/matches/${matchId}`);
  
  if (finalMatchResult.success) {
    const finalMatch = finalMatchResult.data.match;
    console.log(`📊 Final Match Status: ${finalMatch.status}`);
    console.log(`🏆 Winner ID: ${finalMatch.winner_id}`);
    
    if (finalMatch.status === 'completed' && finalMatch.winner_id === player1.id) {
      console.log(`\n✅ End-game logic working correctly!`);
      console.log(`🎯 ${player1.name} won as expected`);
      console.log(`📱 Frontend should redirect both players to: /game/${matchId}/result`);
      
      // Test result page API
      console.log(`\n📄 Step 6: Testing result page data...`);
      console.log(`🌐 Frontend would fetch: /api/matches/${matchId}`);
      console.log(`   - Match status: 'completed'`);
      console.log(`   - Winner: ${player1.id}`);
      console.log(`   - Result page URL: http://localhost:3001/game/${matchId}/result`);
      
      console.log(`\n🎮 Frontend flow:`);
      console.log(`   1. MultiplayerNumberSequenceGame detects match.status = 'completed'`);
      console.log(`   2. Shows "You won! 🎉 Redirecting..." or "You lost 😞 Redirecting..."`);
      console.log(`   3. After 2 seconds, redirects to /game/${matchId}/result`);
      console.log(`   4. MatchResult component loads and displays winner/loser screen`);
      console.log(`   5. Players can click "Back to Main Menu" or "Play Again"`);
      
    } else {
      console.log(`❌ End-game logic failed:`);
      console.log(`   Expected: status='completed', winner='${player1.id}'`);
      console.log(`   Actual: status='${finalMatch.status}', winner='${finalMatch.winner_id}'`);
    }
  } else {
    console.log(`❌ Failed to get final match result:`, finalMatchResult.data);
  }

  console.log(`\n🔍 To test the full flow:`);
  console.log(`1. Open two browser tabs`);
  console.log(`2. Go to http://localhost:3001/queue in both tabs`);
  console.log(`3. Join queue with different player IDs`);
  console.log(`4. Play the game - one player answer correctly, other incorrectly`);
  console.log(`5. Watch both tabs redirect to the result page`);
  console.log(`6. Verify both players see the correct win/loss message`);
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
  testEndGameFlow()
    .then(() => cleanup())
    .catch(async (error) => {
      console.error('❌ Test failed:', error);
      await cleanup();
      process.exit(1);
    });
} else {
  console.log('Use: node test-endgame-flow.js --run');
  console.log('Make sure the Next.js server is running on localhost:3001');
}