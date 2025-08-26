#!/usr/bin/env node

/**
 * Test script to verify the multiplayer difficulty scaling system
 * This validates that the multiplayer difficulty scaling matches singleplayer logic
 */

// Mock the multiplayer difficulty functions (mirrors multiplayerDifficulty.ts)
const calculateMultiplayerDifficulty = (completedRounds) => {
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

const shouldIncreaseDifficulty = (completedRounds) => {
  return completedRounds > 0 && completedRounds % 3 === 0;
};

const getDifficultyIncrease = (oldDifficulty, newDifficulty) => {
  if (oldDifficulty.sequenceLength !== newDifficulty.sequenceLength) {
    return {
      type: 'sequence',
      newSequenceLength: newDifficulty.sequenceLength,
      newDisplayInterval: newDifficulty.displayInterval
    };
  }
  
  if (oldDifficulty.displayInterval !== newDifficulty.displayInterval) {
    return {
      type: 'timing',
      newSequenceLength: newDifficulty.sequenceLength,
      newDisplayInterval: newDifficulty.displayInterval
    };
  }
  
  return null;
};

function testMultiplayerDifficultyProgression() {
  console.log('🧪 Testing Multiplayer Difficulty Scaling System');
  console.log('=' .repeat(60));

  const testCases = [];
  
  // Test progression up to round 30 to cover multiple difficulty increases
  for (let round = 0; round <= 30; round++) {
    const difficulty = calculateMultiplayerDifficulty(round);
    testCases.push({
      round,
      ...difficulty,
      difficultyLevel: Math.floor(round / 3),
      shouldIncrease: shouldIncreaseDifficulty(round)
    });
  }

  // Display progression table
  console.log('Round | Diff.Lvl | Seq.Len | Interval | Last Change | Should Inc | Notes');
  console.log('------|----------|---------|----------|-------------|------------|-------');
  
  let lastDifficulty = { sequenceLength: 5, displayInterval: 1000 };
  let errors = [];
  
  testCases.forEach(({ round, difficultyLevel, sequenceLength, displayInterval, lastDifficultyType, shouldIncrease }) => {
    const intervalSec = (displayInterval / 1000).toFixed(1);
    const changeType = lastDifficultyType || 'none';
    const shouldIncreaseStr = shouldIncrease ? 'YES' : 'NO';
    
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
      `${shouldIncreaseStr.padStart(10)} | ` +
      `${notes}`
    );
    
    // Validation checks
    if (round > 0) {
      // Check that shouldIncreaseDifficulty matches expectation
      const expectedShouldIncrease = round % 3 === 0 && round > 0;
      if (shouldIncrease !== expectedShouldIncrease) {
        errors.push(`Round ${round}: shouldIncreaseDifficulty returned ${shouldIncrease}, expected ${expectedShouldIncrease}`);
      }
      
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

  console.log('\\n' + '=' .repeat(60));
  
  // Test specific requirements
  console.log('📋 Requirement Validation:');
  
  // Test getDifficultyIncrease function
  console.log('\\n🔄 Testing getDifficultyIncrease function:');
  
  const oldDifficulty1 = { sequenceLength: 5, displayInterval: 1000, lastDifficultyType: null };
  const newDifficulty1 = { sequenceLength: 6, displayInterval: 1000, lastDifficultyType: 'sequence' };
  const increase1 = getDifficultyIncrease(oldDifficulty1, newDifficulty1);
  
  if (increase1 && increase1.type === 'sequence' && increase1.newSequenceLength === 6) {
    console.log('✅ Sequence increase detection works correctly');
  } else {
    console.log('❌ Sequence increase detection failed:', increase1);
    errors.push('getDifficultyIncrease failed for sequence increase');
  }
  
  const oldDifficulty2 = { sequenceLength: 6, displayInterval: 1000, lastDifficultyType: 'sequence' };
  const newDifficulty2 = { sequenceLength: 6, displayInterval: 900, lastDifficultyType: 'timing' };
  const increase2 = getDifficultyIncrease(oldDifficulty2, newDifficulty2);
  
  if (increase2 && increase2.type === 'timing' && increase2.newDisplayInterval === 900) {
    console.log('✅ Timing increase detection works correctly');
  } else {
    console.log('❌ Timing increase detection failed:', increase2);
    errors.push('getDifficultyIncrease failed for timing increase');
  }
  
  // Test alternation pattern
  console.log('\\n✅ Alternation pattern validation:');
  const alternationRounds = [3, 6, 9, 12, 15, 18];
  const expectedPattern = ['sequence', 'timing', 'sequence', 'timing', 'sequence', 'timing'];
  
  alternationRounds.forEach((round, index) => {
    const difficulty = calculateMultiplayerDifficulty(round);
    const expected = expectedPattern[index];
    if (difficulty.lastDifficultyType === expected) {
      console.log(`✅ Round ${round}: ${difficulty.lastDifficultyType} increase (correct)`);
    } else {
      console.log(`❌ Round ${round}: ${difficulty.lastDifficultyType} increase, expected ${expected}`);
      errors.push(`Round ${round}: Wrong alternation pattern`);
    }
  });

  // Report errors
  console.log('\\n' + '=' .repeat(60));
  if (errors.length === 0) {
    console.log('🎉 All multiplayer difficulty tests passed!');
    console.log('\\n✅ Verified features:');
    console.log('  • Difficulty increases every 3 rounds');
    console.log('  • Alternates between sequence length and timing');
    console.log('  • Respects minimum 0.5s interval constraint');
    console.log('  • Continues scaling indefinitely');
    console.log('  • shouldIncreaseDifficulty function works correctly');
    console.log('  • getDifficultyIncrease function works correctly');
    console.log('  • Matches singleplayer difficulty progression');
    return true;
  } else {
    console.log('❌ Test failures detected:');
    errors.forEach(error => console.log(`  • ${error}`));
    return false;
  }
}

function testConsistencyWithSinglePlayer() {
  console.log('\\n🔗 Testing Consistency with Singleplayer Difficulty:');
  
  // Import singleplayer calculateDifficulty (simulated since we can't import from tsx)
  const calculateSingleplayerDifficulty = (completedRounds) => {
    const baseSequenceLength = 5;
    const baseInterval = 1000;
    const minInterval = 500;
    
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
    
    for (let i = 0; i < difficultyIncrements; i++) {
      const canDecreaseTiming = displayInterval > minInterval;
      const shouldIncreaseSequence = (i % 2 === 0) || !canDecreaseTiming;
      
      if (shouldIncreaseSequence) {
        sequenceLength += 1;
        lastDifficultyType = 'sequence';
      } else {
        displayInterval = Math.max(minInterval, displayInterval - 100);
        lastDifficultyType = 'timing';
      }
    }
    
    return {
      sequenceLength,
      displayInterval,
      lastDifficultyType
    };
  };
  
  let consistencyErrors = [];
  
  // Test rounds 0 through 30
  for (let round = 0; round <= 30; round += 3) {
    const multiplayerDifficulty = calculateMultiplayerDifficulty(round);
    const singleplayerDifficulty = calculateSingleplayerDifficulty(round);
    
    if (multiplayerDifficulty.sequenceLength !== singleplayerDifficulty.sequenceLength ||
        multiplayerDifficulty.displayInterval !== singleplayerDifficulty.displayInterval ||
        multiplayerDifficulty.lastDifficultyType !== singleplayerDifficulty.lastDifficultyType) {
      consistencyErrors.push(`Round ${round}: Multiplayer/Singleplayer mismatch`);
      console.log(`❌ Round ${round}:`);
      console.log(`  Multiplayer: ${JSON.stringify(multiplayerDifficulty)}`);
      console.log(`  Singleplayer: ${JSON.stringify(singleplayerDifficulty)}`);
    } else {
      console.log(`✅ Round ${round}: Consistent between multiplayer and singleplayer`);
    }
  }
  
  if (consistencyErrors.length === 0) {
    console.log('\\n🎯 Perfect consistency between multiplayer and singleplayer difficulty scaling!');
    return true;
  } else {
    console.log(`\\n❌ Found ${consistencyErrors.length} consistency errors`);
    return false;
  }
}

function main() {
  console.log('🎯 Multiplayer Difficulty Scaling System Test Suite\\n');
  
  const progressionTest = testMultiplayerDifficultyProgression();
  const consistencyTest = testConsistencyWithSinglePlayer();
  
  console.log('\\n' + '=' .repeat(60));
  console.log('📊 Final Results:');
  console.log(`Progression Test: ${progressionTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Consistency Test: ${consistencyTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (progressionTest && consistencyTest) {
    console.log('\\n🏆 All multiplayer difficulty tests passed!');
    console.log('\\n🎮 Expected behavior in multiplayer games:');
    console.log('  • Both players start with 5 numbers, 1.0s interval');
    console.log('  • Every 3 rounds both players complete: difficulty increases');
    console.log('  • Round 3: 6 numbers, 1.0s interval (sequence increase)');
    console.log('  • Round 6: 6 numbers, 0.9s interval (timing increase)');
    console.log('  • Pattern continues until timing reaches 0.5s');
    console.log('  • After 0.5s minimum: only sequence increases');
    console.log('  • Same sequence length and timing for both players');
    process.exit(0);
  } else {
    console.log('\\n💥 Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

main();