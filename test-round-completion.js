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

async function testRoundCompletion() {
  console.log('🧪 Testing Round Completion Issue');
  console.log('==================================');

  // Clean up any existing data
  try {
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    console.log('🧹 Cleaned up existing queue entries');
  } catch (error) {
    console.log('ℹ️  Queue cleanup skipped');
  }

  console.log(`\n📋 Test scenario:`);
  console.log(`1. ${player1.name} joins queue`);
  console.log(`2. ${player2.name} joins queue (creates match)`);
  console.log(`3. Both players submit answers`);
  console.log(`4. Check if round completion works`);

  // Step 1: Player 1 joins queue
  console.log(`\n👤 Step 1: ${player1.name} joining queue...`);
  const joinResult1 = await apiCall('/matchmaking/join', 'POST', { playerId: player1.id });
  
  if (!joinResult1.success) {
    console.error(`❌ ${player1.name} failed to join queue:`, joinResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} in queue`);

  await sleep(1000);

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

  // Step 4: Both players submit answers
  console.log(`\n🎮 Step 4: Both players submitting answers...`);
  
  // Player 1 submits correct answer
  console.log(`👤 ${player1.name} submitting CORRECT answer: ${currentRound.correct_sum}`);
  const submitResult1 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player1.id,
    answer: currentRound.correct_sum
  });
  
  if (!submitResult1.success) {
    console.error(`❌ ${player1.name} failed to submit:`, submitResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} submitted:`, submitResult1.data);

  await sleep(1000);

  // Player 2 submits wrong answer
  const wrongAnswer = currentRound.correct_sum + 10;
  console.log(`👤 ${player2.name} submitting WRONG answer: ${wrongAnswer}`);
  
  const submitResult2 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: player2.id,
    answer: wrongAnswer
  });
  
  if (!submitResult2.success) {
    console.error(`❌ ${player2.name} failed to submit:`, submitResult2.data);
    return;
  }
  
  console.log(`✅ ${player2.name} submitted:`, submitResult2.data);

  await sleep(2000);

  // Step 5: Check final match result
  console.log(`\n🏆 Step 5: Checking final match result...`);
  const finalMatchResult = await apiCall(`/matches/${matchId}`);
  
  if (finalMatchResult.success) {
    const finalMatch = finalMatchResult.data.match;
    console.log(`📊 Final Match Status: ${finalMatch.status}`);
    console.log(`🔄 Current Round: ${finalMatch.current_round}`);
    
    if (finalMatch.status === 'completed') {
      const winnerName = finalMatch.winner_id === player1.id ? player1.name : 
                         finalMatch.winner_id === player2.id ? player2.name : 'Unknown';
      console.log(`🎉 Winner: ${winnerName} (${finalMatch.winner_id})`);
      console.log(`✅ Round completion worked correctly!`);
    } else if (finalMatch.status === 'active') {
      console.log(`❌ Issue: Match is still active. Round completion may have failed.`);
      console.log(`ℹ️  Expected: Match should be completed with ${player1.name} as winner`);
    }
  }

  console.log('\n🔍 Check the server logs for detailed debugging information.');
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
  testRoundCompletion()
    .then(() => cleanup())
    .catch(async (error) => {
      console.error('❌ Test failed:', error);
      await cleanup();
      process.exit(1);
    });
} else {
  console.log('Use: node test-round-completion.js --run');
  console.log('Make sure the Next.js server is running on localhost:3001');
}