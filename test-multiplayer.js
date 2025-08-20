// Multiplayer test simulation
const { createClient } = require('@supabase/supabase-js');

// Use node-fetch if fetch is not available globally
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiBase = 'http://localhost:3001/api';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate two players
const player1 = { id: 'player001', name: 'Alice' };
const player2 = { id: 'player002', name: 'Bob' };

let matchId = null;

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

async function testMatchmaking() {
  console.log('🎮 Testing Multiplayer Matchmaking Simulation');
  console.log('================================================');

  // Step 1: Player 1 joins queue
  console.log(`\n👤 ${player1.name} (${player1.id}) joining queue...`);
  const joinResult1 = await apiCall('/matchmaking/join', 'POST', { playerId: player1.id });
  
  if (!joinResult1.success) {
    console.error(`❌ ${player1.name} failed to join queue:`, joinResult1.data);
    return;
  }
  
  console.log(`✅ ${player1.name} joined queue:`, joinResult1.data);
  
  // Step 2: Check queue status
  await sleep(1000);
  
  // Step 3: Player 2 joins queue (should create match)
  console.log(`\n👤 ${player2.name} (${player2.id}) joining queue...`);
  const joinResult2 = await apiCall('/matchmaking/join', 'POST', { playerId: player2.id });
  
  if (!joinResult2.success) {
    console.error(`❌ ${player2.name} failed to join queue:`, joinResult2.data);
    return;
  }
  
  console.log(`✅ ${player2.name} joined queue:`, joinResult2.data);
  
  // Check if match was created
  if (joinResult2.data.matched) {
    matchId = joinResult2.data.matchId;
    console.log(`🎯 Match created! Match ID: ${matchId}`);
    console.log(`🤝 Players matched: ${player1.name} vs ${player2.name}`);
  } else {
    console.log('⏳ No immediate match, waiting...');
    return;
  }

  await sleep(1000);

  // Step 4: Get match details
  console.log(`\n📋 Getting match details...`);
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
  console.log(`🎯 Target Sum: ${currentRound.target_sum}`);
  console.log(`👤 Current Turn: ${match.current_turn === player1.id ? player1.name : player2.name}`);

  await sleep(1000);

  // Step 5: First player submits answer
  const firstPlayer = match.current_turn === player1.id ? player1 : player2;
  const firstPlayerName = match.current_turn === player1.id ? player1.name : player2.name;
  
  console.log(`\n🎮 ${firstPlayerName} submitting answer...`);
  
  // Find a valid combination that sums to target (simple greedy approach)
  const sequence = currentRound.sequence;
  const targetSum = currentRound.target_sum;
  const selectedNumbers = findValidCombination(sequence, targetSum);
  
  console.log(`🔢 ${firstPlayerName} selected: [${selectedNumbers.join(', ')}]`);
  console.log(`➕ Sum: ${selectedNumbers.reduce((a, b) => a + b, 0)} (target: ${targetSum})`);
  
  const submitResult1 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: firstPlayer.id,
    selectedNumbers: selectedNumbers
  });
  
  if (!submitResult1.success) {
    console.error(`❌ ${firstPlayerName} failed to submit:`, submitResult1.data);
    return;
  }
  
  console.log(`✅ ${firstPlayerName} submitted:`, submitResult1.data);

  await sleep(1000);

  // Step 6: Second player submits answer
  const secondPlayer = match.current_turn === player1.id ? player2 : player1;
  const secondPlayerName = match.current_turn === player1.id ? player2.name : player1.name;
  
  console.log(`\n🎮 ${secondPlayerName} submitting answer...`);
  
  // Intentionally submit a wrong answer for demonstration
  const wrongNumbers = sequence.slice(0, 2); // Just take first 2 numbers (likely wrong)
  
  console.log(`🔢 ${secondPlayerName} selected: [${wrongNumbers.join(', ')}]`);
  console.log(`➕ Sum: ${wrongNumbers.reduce((a, b) => a + b, 0)} (target: ${targetSum})`);
  
  const submitResult2 = await apiCall(`/matches/${matchId}/submit`, 'POST', {
    playerId: secondPlayer.id,
    selectedNumbers: wrongNumbers
  });
  
  if (!submitResult2.success) {
    console.error(`❌ ${secondPlayerName} failed to submit:`, submitResult2.data);
    return;
  }
  
  console.log(`✅ ${secondPlayerName} submitted:`, submitResult2.data);

  await sleep(1000);

  // Step 7: Check final match result
  console.log(`\n🏆 Checking final match result...`);
  const finalMatchResult = await apiCall(`/matches/${matchId}`);
  
  if (finalMatchResult.success) {
    const finalMatch = finalMatchResult.data.match;
    console.log(`📊 Final Match Status: ${finalMatch.status}`);
    
    if (finalMatch.status === 'completed') {
      const winnerName = finalMatch.winner_id === player1.id ? player1.name : player2.name;
      console.log(`🎉 Winner: ${winnerName} (${finalMatch.winner_id})`);
    }
  }

  console.log('\n✅ Multiplayer test simulation completed!');
}

// Helper function to find a valid combination
function findValidCombination(sequence, targetSum) {
  // Try to find a subset that sums to target
  for (let i = 0; i < sequence.length; i++) {
    for (let j = i + 1; j < sequence.length; j++) {
      for (let k = j + 1; k < sequence.length; k++) {
        if (sequence[i] + sequence[j] + sequence[k] === targetSum) {
          return [sequence[i], sequence[j], sequence[k]];
        }
      }
    }
  }
  
  // If no exact match, return first few numbers
  return sequence.slice(0, 3);
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Remove test players from queue
    await supabase.from('matchmaking_queue').delete().in('player_id', [player1.id, player2.id]);
    
    // Optionally clean up test matches (be careful in production!)
    if (matchId) {
      await supabase.from('match_rounds').delete().eq('match_id', matchId);
      await supabase.from('matches').delete().eq('id', matchId);
      console.log(`🗑️  Cleaned up test match: ${matchId}`);
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️  Cleanup error (this is usually fine):', error.message);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted');
  await cleanup();
  process.exit(0);
});

// Run the test
if (process.argv.includes('--run')) {
  testMatchmaking()
    .then(() => cleanup())
    .catch(async (error) => {
      console.error('❌ Test failed:', error);
      await cleanup();
      process.exit(1);
    });
} else {
  console.log('Use: node test-multiplayer.js --run');
  console.log('Make sure the Next.js server is running on localhost:3000');
}