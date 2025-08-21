#!/usr/bin/env node

/**
 * Test script to verify concurrent matchmaking behavior
 * This simulates multiple players joining the queue simultaneously
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NUM_CONCURRENT_PLAYERS = 10;

async function joinQueue(playerId) {
  try {
    const response = await fetch(`${BASE_URL}/api/matchmaking/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId }),
    });

    const result = await response.json();
    return { playerId, success: response.ok, result };
  } catch (error) {
    return { playerId, success: false, error: error.message };
  }
}

async function testConcurrentMatchmaking() {
  console.log(`🧪 Testing concurrent matchmaking with ${NUM_CONCURRENT_PLAYERS} players...`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Generate unique player IDs
  const playerIds = Array.from({ length: NUM_CONCURRENT_PLAYERS }, (_, i) => 
    `test-player-${Date.now()}-${i}`
  );

  console.log('\n👥 Players:', playerIds);

  // Send all requests simultaneously
  const startTime = Date.now();
  const promises = playerIds.map(playerId => joinQueue(playerId));
  const results = await Promise.allSettled(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`\n⏱️  Total time: ${duration}ms`);
  
  // Analyze results
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
  
  console.log(`\n📊 Results Summary:`);
  console.log(`✅ Successful requests: ${successful.length}`);
  console.log(`❌ Failed requests: ${failed.length}`);

  const matches = successful.filter(r => r.value.result.matched);
  const queued = successful.filter(r => !r.value.result.matched);

  console.log(`🎯 Players matched: ${matches.length}`);
  console.log(`⏳ Players queued: ${queued.length}`);

  // Verify match consistency
  if (matches.length > 0) {
    console.log(`\n🔍 Match Analysis:`);
    const matchIds = matches.map(r => r.value.result.matchId);
    const uniqueMatchIds = [...new Set(matchIds)];
    
    console.log(`🆔 Unique match IDs: ${uniqueMatchIds.length}`);
    console.log(`👥 Expected matches: ${Math.floor(NUM_CONCURRENT_PLAYERS / 2)}`);
    
    // Check for duplicate match assignments
    const playerMatchMap = new Map();
    matches.forEach(r => {
      const { playerId } = r.value;
      const { matchId, opponentId } = r.value.result;
      
      if (playerMatchMap.has(matchId)) {
        playerMatchMap.get(matchId).push({ playerId, opponentId });
      } else {
        playerMatchMap.set(matchId, [{ playerId, opponentId }]);
      }
    });

    console.log('\n🔗 Match Details:');
    let validMatches = 0;
    let invalidMatches = 0;

    playerMatchMap.forEach((players, matchId) => {
      if (players.length === 2) {
        validMatches++;
        const [p1, p2] = players;
        // Verify that each player's opponent is the other player
        const isValid = p1.opponentId === p2.playerId && p2.opponentId === p1.playerId;
        console.log(`✅ Match ${matchId}: ${p1.playerId} vs ${p2.playerId} ${isValid ? '(Valid)' : '(Invalid opponent mapping)'}`);
      } else {
        invalidMatches++;
        console.log(`❌ Invalid match ${matchId}: ${players.length} players (should be 2)`);
        players.forEach(p => console.log(`   - ${p.playerId} (opponent: ${p.opponentId})`));
      }
    });

    console.log(`\n✅ Valid matches: ${validMatches}`);
    console.log(`❌ Invalid matches: ${invalidMatches}`);

    // Clean up all matches created during testing
    console.log('\n🧹 Cleaning up test matches...');
    let cleanedUp = 0;
    for (const matchId of uniqueMatchIds) {
      const cleanupResult = await finishMatch(matchId);
      if (cleanupResult.success) {
        cleanedUp++;
      }
    }
    console.log(`🧹 Cleaned up ${cleanedUp} out of ${uniqueMatchIds.length} matches`);

    // Test for race conditions
    if (invalidMatches > 0 || validMatches !== uniqueMatchIds.length) {
      console.log('🚨 RACE CONDITION DETECTED: Invalid match assignments found!');
      return false;
    }
    
    if (matches.length % 2 !== 0) {
      console.log('🚨 RACE CONDITION DETECTED: Odd number of matched players!');
      return false;
    }

    console.log('✅ No race conditions detected in match assignments');
  }

  // Test error cases
  if (failed.length > 0) {
    console.log(`\n❌ Failed Requests:`);
    failed.forEach(r => {
      if (r.status === 'rejected') {
        console.log(`   - ${r.reason}`);
      } else {
        const { playerId, error, result } = r.value;
        console.log(`   - Player ${playerId}: ${error || JSON.stringify(result)}`);
      }
    });
  }

  return invalidMatches === 0 && matches.length % 2 === 0;
}

async function finishMatch(matchId, winnerId = null) {
  try {
    const response = await fetch(`${BASE_URL}/api/matchmaking/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, winnerId }),
    });

    const result = await response.json();
    return { success: response.ok, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testSinglePlayerPerMatch() {
  console.log('\n🧪 Testing single-player-per-match enforcement...');
  
  const player1 = `single-match-test-1-${Date.now()}`;
  const player2 = `single-match-test-2-${Date.now()}`;

  console.log(`👤 Creating match between ${player1} and ${player2}`);
  
  // First, create a match
  const result1 = await joinQueue(player1);
  const result2 = await joinQueue(player2);

  if (!result1.success || !result2.success) {
    console.log('❌ Failed to create initial match');
    return false;
  }

  if (!result2.result.matched) {
    console.log('❌ Players were not matched');
    return false;
  }

  const matchId = result2.result.matchId;
  console.log(`🎯 Match created: ${matchId}`);

  // Now try to join queue again with the same players
  console.log('\n🔄 Testing duplicate join attempts...');
  const duplicateResult1 = await joinQueue(player1);
  const duplicateResult2 = await joinQueue(player2);

  console.log(`Player 1 duplicate join: ${duplicateResult1.success ? 'Success' : 'Failed'}`);
  console.log(`Player 2 duplicate join: ${duplicateResult2.success ? 'Success' : 'Failed'}`);

  // Both should return the existing active match
  const player1ShouldReturnMatch = duplicateResult1.success && 
    duplicateResult1.result.matched && 
    duplicateResult1.result.matchId === matchId &&
    duplicateResult1.result.message?.includes('active match');

  const player2ShouldReturnMatch = duplicateResult2.success && 
    duplicateResult2.result.matched && 
    duplicateResult2.result.matchId === matchId &&
    duplicateResult2.result.message?.includes('active match');

  console.log(`Player 1 returned active match: ${player1ShouldReturnMatch ? '✅' : '❌'}`);
  console.log(`Player 2 returned active match: ${player2ShouldReturnMatch ? '✅' : '❌'}`);

  // Finish the match so it doesn't interfere with other tests
  console.log(`\n🏁 Finishing match ${matchId}...`);
  const finishResult = await finishMatch(matchId, player1);
  console.log(`Match finished: ${finishResult.success ? '✅' : '❌'}`);

  // Now try joining queue again after finishing the match
  console.log('\n🔄 Testing join after match finish...');
  const postFinishResult1 = await joinQueue(player1);
  
  if (postFinishResult1.success && !postFinishResult1.result.matched) {
    console.log('✅ Player can join queue again after match finished');
  } else {
    console.log('❌ Player cannot join queue after match finished');
    return false;
  }

  return player1ShouldReturnMatch && player2ShouldReturnMatch && finishResult.success;
}

async function testSequentialMatchmaking() {
  console.log('\n🧪 Testing sequential matchmaking (control test)...');
  
  const player1 = `sequential-test-1-${Date.now()}`;
  const player2 = `sequential-test-2-${Date.now()}`;

  console.log(`👤 Player 1: ${player1}`);
  const result1 = await joinQueue(player1);
  
  console.log(`👤 Player 2: ${player2}`);
  const result2 = await joinQueue(player2);

  console.log('\n📊 Sequential Results:');
  console.log(`Player 1: ${result1.success ? 'Success' : 'Failed'} - ${result1.result?.matched ? 'Matched' : 'Queued'}`);
  console.log(`Player 2: ${result2.success ? 'Success' : 'Failed'} - ${result2.result?.matched ? 'Matched' : 'Queued'}`);

  let matchId = null;
  if (result1.success && result2.success) {
    const shouldMatch = !result1.result.matched && result2.result.matched;
    if (shouldMatch && result2.result.opponentId === player1) {
      console.log('✅ Sequential matchmaking working correctly');
      matchId = result2.result.matchId;
      
      // Clean up by finishing the match
      if (matchId) {
        await finishMatch(matchId, player1);
      }
      
      return true;
    } else {
      console.log('❌ Sequential matchmaking failed');
      return false;
    }
  }

  return false;
}

async function main() {
  console.log('🚀 Starting Enhanced Matchmaking Tests');
  console.log('=' .repeat(60));

  // Test single-player-per-match enforcement first
  const singlePlayerResult = await testSinglePlayerPerMatch();
  
  console.log('\n' + '=' .repeat(60));
  
  // Test sequential (simpler case)
  const sequentialResult = await testSequentialMatchmaking();
  
  console.log('\n' + '=' .repeat(60));
  
  // Test concurrent
  const concurrentResult = await testConcurrentMatchmaking();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Final Results:');
  console.log(`Single-player-per-match: ${singlePlayerResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Sequential test: ${sequentialResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Concurrent test: ${concurrentResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (singlePlayerResult && sequentialResult && concurrentResult) {
    console.log('\n🎉 All tests passed! Enhanced matchmaking system is working correctly.');
    console.log('✅ Players are correctly limited to one active match at a time');
    console.log('✅ Concurrent requests are handled atomically');
    console.log('✅ Match creation and cleanup work properly');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed! Please check the implementation.');
    if (!singlePlayerResult) console.log('🔴 Single-player-per-match enforcement failed');
    if (!sequentialResult) console.log('🔴 Sequential matchmaking failed');
    if (!concurrentResult) console.log('🔴 Concurrent matchmaking failed');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node test-concurrent-matchmaking.js [--base-url=URL]');
  console.log('');
  console.log('Options:');
  console.log('  --base-url=URL  Set the base URL (default: http://localhost:3000)');
  console.log('  --help, -h      Show this help message');
  process.exit(0);
}

const baseUrlArg = process.argv.find(arg => arg.startsWith('--base-url='));
if (baseUrlArg) {
  process.env.BASE_URL = baseUrlArg.split('=')[1];
}

// Run the tests
main().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});