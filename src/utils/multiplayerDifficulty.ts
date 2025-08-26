import { MultiplayerDifficultySettings } from '@/types/multiplayer';

/**
 * Calculate multiplayer difficulty settings based on completed rounds
 * This mirrors the singleplayer difficulty scaling logic
 */
export const calculateMultiplayerDifficulty = (completedRounds: number): MultiplayerDifficultySettings => {
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
  let lastDifficultyType: 'sequence' | 'timing' | null = null;
  
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

/**
 * Check if difficulty should increase for the given completed rounds
 */
export const shouldIncreaseDifficulty = (completedRounds: number): boolean => {
  return completedRounds > 0 && completedRounds % 3 === 0;
};

/**
 * Get difficulty increase information for notifications
 */
export const getDifficultyIncrease = (
  oldDifficulty: MultiplayerDifficultySettings,
  newDifficulty: MultiplayerDifficultySettings
): { type: 'sequence' | 'timing'; newSequenceLength: number; newDisplayInterval: number } | null => {
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