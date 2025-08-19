'use client';

import { useState, useCallback } from 'react';
import { generateRandomSequence, calculateSum } from '@/utils/gameHelpers';

export type GameState = 'idle' | 'displaying' | 'input' | 'result';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(-1);
  const [correctSum, setCorrectSum] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const startGame = useCallback(() => {
    const newSequence = generateRandomSequence(5);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setGameState('displaying');
  }, []);

  const nextNumber = useCallback(() => {
    setCurrentNumberIndex(prev => prev + 1);
  }, []);

  const finishSequence = useCallback(() => {
    setGameState('input');
  }, []);

  const submitAnswer = useCallback(() => {
    const userSum = parseInt(userAnswer, 10);
    setIsCorrect(userSum === correctSum);
    setGameState('result');
  }, [userAnswer, correctSum]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setSequence([]);
    setCurrentNumberIndex(-1);
    setCorrectSum(0);
    setUserAnswer('');
    setIsCorrect(null);
  }, []);

  return {
    gameState,
    sequence,
    currentNumberIndex,
    correctSum,
    userAnswer,
    setUserAnswer,
    isCorrect,
    startGame,
    nextNumber,
    finishSequence,
    submitAnswer,
    resetGame
  };
};