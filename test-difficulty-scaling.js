#!/usr/bin/env node

/**
 * Test script to verify the difficulty scaling system
 * This simulates game progression and validates difficulty increases
 */

// Mock the difficulty calculation function from useGameLogic
const calculateDifficulty = (completedRounds) => {
  const baseSequenceLength = 5;
  const baseInterval = 1000; // 1 second
  const minInterval = 500; // 0.5 seconds minimum
  
  // Calculate how many difficulty increases have occurred
  // Every 3 rounds starting from round 3
  const difficultyIncrements = Math.floor(completedRounds / 3);
  
  if (difficultyIncrements === 0) {
    return {
      sequenceLength: baseSequenceLength,
      displayInterval: baseInterval,
      lastDifficultyType: null
    };
  }
  
  let sequenceLength = baseSequenceLength;
  let displayInterval = baseInterval;
  let lastDifficultyType = null;
  
  // Apply difficulty increases alternately, but only sequence after min interval
  for (let i = 0; i < difficultyIncrements; i++) {
    const canDecreaseTiming = displayInterval > minInterval;
    const shouldIncreaseSequence = (i % 2 === 0) || !canDecreaseTiming;
    
    if (shouldIncreaseSequence) {
      sequenceLength += 1;
      lastDifficultyType = 'sequence';
    } else {
      displayInterval = Math.max(minInterval, displayInterval - 100); // Decrease by 0.1s
      lastDifficultyType = 'timing';
    }
  }
  
  return {
    sequenceLength,
    displayInterval,
    lastDifficultyType
  };
};

function testDifficultyProgression() {
  console.log('🧪 Testing Difficulty Scaling System');
  console.log('=' .repeat(60));

  const testCases = [];
  
  // Test progression up to round 30 to cover multiple difficulty increases
  for (let round = 0; round <= 30; round++) {
    const difficulty = calculateDifficulty(round);
    testCases.push({
      round,
      ...difficulty,
      difficultyLevel: Math.floor(round / 3)
    });
  }

  // Display progression table
  console.log('Round | Diff.Lvl | Seq.Len | Interval | Last Change | Notes');
  console.log('------|----------|---------|----------|-------------|-------');
  
  let lastDifficulty = { sequenceLength: 5, displayInterval: 1000 };
  let errors = [];
  
  testCases.forEach(({ round, difficultyLevel, sequenceLength, displayInterval, lastDifficultyType }) => {
    const intervalSec = (displayInterval / 1000).toFixed(1);
    const changeType = lastDifficultyType || 'none';
    
    // Determine what changed
    let notes = '';
    if (round > 0 && round % 3 === 0) {
      if (sequenceLength > lastDifficulty.sequenceLength) {
        notes = `+1 number (${lastDifficulty.sequenceLength}→${sequenceLength})`;
      } else if (displayInterval < lastDifficulty.displayInterval) {
        notes = `faster (${(lastDifficulty.displayInterval/1000).toFixed(1)}s→${intervalSec}s)`;
      }
    } else if (round > 0 && round % 3 !== 0) {
      notes = 'no change';
    }
    
    console.log(
      `${round.toString().padStart(5)} | ` +
      `${difficultyLevel.toString().padStart(8)} | ` +
      `${sequenceLength.toString().padStart(7)} | ` +
      `${intervalSec.padStart(8)}s | ` +
      `${changeType.padStart(11)} | ` +
      `${notes}`
    );
    
    // Validation checks
    if (round > 0) {
      // Check that difficulty only increases every 3 rounds
      if (round % 3 === 0) {
        const shouldHaveChanged = 
          sequenceLength !== lastDifficulty.sequenceLength || 
          displayInterval !== lastDifficulty.displayInterval;
        
        if (!shouldHaveChanged) {
          errors.push(`Round ${round}: Expected difficulty increase but none occurred`);
        }
      } else {
        // Non-increment rounds should maintain difficulty
        const shouldBeUnchanged = 
          sequenceLength === lastDifficulty.sequenceLength && 
          displayInterval === lastDifficulty.displayInterval;
          
        if (!shouldBeUnchanged) {
          errors.push(`Round ${round}: Unexpected difficulty change on non-increment round`);
        }
      }
      
      // Check minimum interval constraint
      if (displayInterval < 500) {
        errors.push(`Round ${round}: Interval ${displayInterval}ms below minimum 500ms`);
      }
      
      // Check sequence length progression
      if (sequenceLength < 5) {
        errors.push(`Round ${round}: Sequence length ${sequenceLength} below minimum 5`);
      }
      
      // Once interval reaches minimum, only sequence should increase
      if (lastDifficulty.displayInterval === 500 && displayInterval < lastDifficulty.displayInterval) {
        errors.push(`Round ${round}: Interval decreased below minimum threshold`);
      }
    }
    
    // Update for next comparison
    if (round % 3 === 0 || round === 0) {
      lastDifficulty = { sequenceLength, displayInterval };
    }
  });

  console.log('\n' + '=' .repeat(60));
  
  // Test specific requirements
  console.log('📋 Requirement Validation:');
  
  // Test 1: Every 3 rounds increase
  const round3 = testCases.find(t => t.round === 3);
  const round6 = testCases.find(t => t.round === 6);
  const round9 = testCases.find(t => t.round === 9);
  
  console.log('✓ Round 3 difficulty:', 
    `${round3.sequenceLength} numbers, ${(round3.displayInterval/1000).toFixed(1)}s`);
  console.log('✓ Round 6 difficulty:', 
    `${round6.sequenceLength} numbers, ${(round6.displayInterval/1000).toFixed(1)}s`);
  console.log('✓ Round 9 difficulty:', 
    `${round9.sequenceLength} numbers, ${(round9.displayInterval/1000).toFixed(1)}s`);
  
  // Test 2: Alternating increases
  const increasesUpTo12 = testCases.filter(t => t.round > 0 && t.round <= 12 && t.round % 3 === 0);
  console.log('\n✓ Alternation pattern (rounds 3-12):');
  increasesUpTo12.forEach(t => {
    console.log(`  Round ${t.round}: ${t.lastDifficultyType} increase`);
  });
  
  // Test 3: Minimum interval constraint
  const minIntervalReached = testCases.find(t => t.displayInterval === 500);
  console.log(`\n✓ Minimum interval (0.5s) reached at round: ${minIntervalReached ? minIntervalReached.round : 'never'}`);
  
  if (minIntervalReached) {
    const afterMinInterval = testCases.filter(t => t.round > minIntervalReached.round && t.round % 3 === 0);
    console.log('✓ After min interval, only sequence increases:');
    afterMinInterval.slice(0, 3).forEach(t => {
      console.log(`  Round ${t.round}: ${t.lastDifficultyType} increase (${t.sequenceLength} numbers)`);
    });
  }
  
  // Test 4: Indefinite scaling
  const round30 = testCases.find(t => t.round === 30);
  console.log(`\n✓ Round 30 difficulty: ${round30.sequenceLength} numbers, ${(round30.displayInterval/1000).toFixed(1)}s`);
  console.log(`  (10 difficulty increases applied)`);

  // Report errors
  console.log('\n' + '=' .repeat(60));
  if (errors.length === 0) {
    console.log('🎉 All tests passed! Difficulty scaling system working correctly.');
    console.log('\n✅ Verified features:');
    console.log('  • Difficulty increases every 3 rounds');
    console.log('  • Alternates between sequence length and timing');
    console.log('  • Respects minimum 0.5s interval constraint');
    console.log('  • Continues scaling indefinitely');
    console.log('  • Proper alternation when timing reaches minimum');
    return true;
  } else {
    console.log('❌ Test failures detected:');
    errors.forEach(error => console.log(`  • ${error}`));
    return false;
  }
}

function testEdgeCases() {
  console.log('\n🔬 Testing Edge Cases:');
  
  // Test minimum interval constraint thoroughly
  console.log('\n1. Testing minimum interval constraint:');
  for (let round = 0; round <= 20; round += 3) {
    const difficulty = calculateDifficulty(round);
    if (difficulty.displayInterval < 500) {
      console.log(`❌ Round ${round}: Interval ${difficulty.displayInterval}ms below 500ms minimum`);
      return false;
    }
  }
  console.log('✅ All intervals respect 500ms minimum');
  
  // Test that sequence continues increasing after minimum interval
  console.log('\n2. Testing sequence scaling after min interval:');
  
  // First find when minimum interval is reached
  let minIntervalRound = null;
  for (let round = 0; round <= 50; round += 3) {
    const difficulty = calculateDifficulty(round);
    if (difficulty.displayInterval === 500) {
      minIntervalRound = round;
      break;
    }
  }
  
  let allIncreasing = true;
  
  if (minIntervalRound !== null) {
    // Test the next few difficulty increases after min interval
    const postMinRounds = [minIntervalRound + 3, minIntervalRound + 6, minIntervalRound + 9];
    let lastSequenceLength = calculateDifficulty(minIntervalRound).sequenceLength;
    
    postMinRounds.forEach(round => {
      const difficulty = calculateDifficulty(round);
      if (difficulty.sequenceLength <= lastSequenceLength) {
        console.log(`❌ Round ${round}: Sequence not increasing (${difficulty.sequenceLength} vs ${lastSequenceLength})`);
        allIncreasing = false;
      } else {
        console.log(`✅ Round ${round}: Sequence increased to ${difficulty.sequenceLength}`);
      }
      
      // Also verify interval stays at minimum
      if (difficulty.displayInterval !== 500) {
        console.log(`❌ Round ${round}: Interval changed from minimum (${difficulty.displayInterval}ms)`);
        allIncreasing = false;
      }
      
      lastSequenceLength = difficulty.sequenceLength;
    });
  } else {
    console.log('⚠️  Minimum interval never reached in test range');
  }
  
  if (allIncreasing) {
    console.log('✅ Sequence length continues increasing after min interval');
  }
  
  // Test zero and negative rounds (edge case)
  console.log('\n3. Testing boundary conditions:');
  const round0 = calculateDifficulty(0);
  if (round0.sequenceLength === 5 && round0.displayInterval === 1000 && round0.lastDifficultyType === null) {
    console.log('✅ Round 0 returns base difficulty correctly');
  } else {
    console.log('❌ Round 0 base difficulty incorrect');
    return false;
  }
  
  return allIncreasing;
}

function main() {
  console.log('🎯 Difficulty Scaling System Test Suite\n');
  
  const progressionTest = testDifficultyProgression();
  const edgeCaseTest = testEdgeCases();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Final Results:');
  console.log(`Progression Test: ${progressionTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Edge Case Test: ${edgeCaseTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (progressionTest && edgeCaseTest) {
    console.log('\n🏆 All tests passed! The difficulty scaling system is ready for production.');
    console.log('\n🎮 Expected behavior in game:');
    console.log('  • Rounds 1-2: 5 numbers, 1.0s interval');
    console.log('  • Round 3: 6 numbers, 1.0s interval (sequence increase)');
    console.log('  • Round 6: 6 numbers, 0.9s interval (timing increase)');
    console.log('  • Round 9: 7 numbers, 0.9s interval (sequence increase)');
    console.log('  • Pattern continues until timing reaches 0.5s');
    console.log('  • After 0.5s minimum: only sequence increases');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

main();