'use client';

import { useState, useCallback } from 'react';
import { generateRandomSequence, calculateSum } from '@/utils/gameHelpers';

export type GameState = 'idle' | 'displaying' | 'input' | 'result' | 'gameOver';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(-1);
  const [correctSum, setCorrectSum] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);

  const startGame = useCallback(() => {
    const newSequence = generateRandomSequence(5);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(1);
    setFinalScore(0);
    setGameState('displaying');
  }, []);

  const nextRound = useCallback(() => {
    const newSequence = generateRandomSequence(5);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(prev => prev + 1);
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
    const correct = userSum === correctSum;
    setIsCorrect(correct);
    
    if (correct) {
      setGameState('result');
    } else {
      setFinalScore(currentRound);
      setGameState('gameOver');
    }
  }, [userAnswer, correctSum, currentRound]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setSequence([]);
    setCurrentNumberIndex(-1);
    setCorrectSum(0);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(0);
    setFinalScore(0);
  }, []);

  return {
    gameState,
    sequence,
    currentNumberIndex,
    correctSum,
    userAnswer,
    setUserAnswer,
    isCorrect,
    currentRound,
    finalScore,
    startGame,
    nextNumber,
    finishSequence,
    submitAnswer,
    nextRound,
    resetGame
  };
};