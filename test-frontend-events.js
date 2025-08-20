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

async function testFrontendEventHandling() {
  console.log('🧪 Testing Frontend Event Handling');
  console.log('=====================================');

  // Clean up any existing data
  try {
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    console.log('🧹 Cleaned up existing queue entries');
  } catch (error) {
    console.log('ℹ️  Queue cleanup skipped');
  }

  console.log(`\n📋 Test scenario:`);
  console.log(`1. Create match between ${player1.name} and ${player2.name}`);
  console.log(`2. Both players submit answers (one correct, one wrong)`);
  console.log(`3. Monitor server logs and check if frontend would receive events`);
  console.log(`4. Verify browser console would show debugging information`);

  // Step 1: Player 1 joins queue
  console.log(`\n👤 Step 1: ${player1.name} joining queue...`);
  const joinResult1 = await apiCall('/matchmaking/join', 'POST', { playerId: player1.id });
  
  if (!joinResult1.success) {
    console.error(`❌ ${player1.name} failed to join queue:`, joinResult1.data);
    return;
  }

  // Step 2: Player 2 joins queue (should create match)
  console.log(`\n👤 Step 2: ${player2.name} joining queue...`);
  const joinResult2 = await apiCall('/matchmaking/join', 'POST', { playerId: player2.id });
  
  if (!joinResult2.success) {
    console.error(`❌ ${player2.name} failed to join queue:`, joinResult2.data);
    return;
  }
  
  if (!joinResult2.data.matched) {
    console.log('❌ No match was created');
    return;
  }

  const matchId = joinResult2.data.matchId;
  console.log(`🎯 Match created: ${matchId}`);

  await sleep(1000);

  // Step 3: Get match details
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

  console.log(`\n🎮 Step 4: Simulating frontend behavior...`);
  console.log(`📱 In the browser, you would see these console logs:`);
  console.log(`   - useMultiplayerGame would show match state updates`);
  console.log(`   - MultiplayerNumberSequenceGame would show state changes`);
  console.log(`   - Pusher events would be logged in the browser console`);

  // Step 4: Both players submit answers with detailed timing
  console.log(`\n🎮 Step 5: Both players submitting answers...`);
  
  // Player 1 submits correct answer
  console.log(`\n👤 ${player1.name} submitting CORRECT answer: ${currentRound.correct_sum}`);
  console.log(`   📱 Frontend would show: gameState='waiting', hasSubmitted=true`);
  
  const submitResult1 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player1.id,
    answer: currentRound.correct_sum
  });
  
  if (!submitResult1.success) {
    console.error(`❌ ${player1.name} failed to submit:`, submitResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} submitted successfully`);
  console.log(`   📱 Frontend should receive: 'answer-submitted' Pusher event`);
  
  await sleep(2000);

  // Player 2 submits wrong answer
  const wrongAnswer = currentRound.correct_sum + 10;
  console.log(`\n👤 ${player2.name} submitting WRONG answer: ${wrongAnswer}`);
  console.log(`   📱 Frontend would show: gameState='waiting', hasSubmitted=true`);
  
  const submitResult2 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player2.id,
    answer: wrongAnswer
  });
  
  if (!submitResult2.success) {
    console.error(`❌ ${player2.name} failed to submit:`, submitResult2.data);
    return;
  }
  
  console.log(`✅ ${player2.name} submitted successfully`);
  console.log(`   📱 Frontend should receive: 'round-completed' Pusher event`);
  console.log(`   📱 Event data should include: match.status='completed', match.winner_id='${player1.id}'`);

  await sleep(3000);

  // Step 5: Check final match result
  console.log(`\n🏆 Step 6: Checking final match result...`);
  const finalMatchResult = await apiCall(`/matches/${matchId}`);
  
  if (finalMatchResult.success) {
    const finalMatch = finalMatchResult.data.match;
    console.log(`📊 Final Match Status: ${finalMatch.status}`);
    console.log(`🏆 Winner: ${finalMatch.winner_id}`);
    
    if (finalMatch.status === 'completed' && finalMatch.winner_id === player1.id) {
      console.log(`\n✅ Backend processing worked correctly!`);
      console.log(`📱 Frontend debugging checklist:`);
      console.log(`   1. Open browser dev tools and go to console`);
      console.log(`   2. Look for Pusher connection logs`);
      console.log(`   3. Check for 'round-completed' event received logs`);
      console.log(`   4. Verify state updates in useMultiplayerGame hook`);
      console.log(`   5. Check getStatusMessage logs in MultiplayerNumberSequenceGame`);
      console.log(`   6. Ensure isGameActive becomes false when match.status='completed'`);
      console.log(`   7. Verify winner message displays correctly`);
    } else {
      console.log(`❌ Backend issue: Expected completed match with ${player1.name} as winner`);
    }
  }

  console.log(`\n🔍 Next steps for debugging frontend:`);
  console.log(`1. Start the Next.js dev server: npm run dev`);
  console.log(`2. Open two browser tabs and navigate to the game`);
  console.log(`3. Create a match and submit answers`);
  console.log(`4. Watch the browser console for the debugging logs we added`);
  console.log(`5. Look for any errors in Pusher event handling`);
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
  testFrontendEventHandling()
    .then(() => cleanup())
    .catch(async (error) => {
      console.error('❌ Test failed:', error);
      await cleanup();
      process.exit(1);
    });
} else {
  console.log('Use: node test-frontend-events.js --run');
  console.log('Make sure the Next.js server is running on localhost:3001');
}