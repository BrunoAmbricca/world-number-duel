'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerActive && timeLeft === 0) {
      // Timer expired - auto game over
      setIsTimerActive(false);
      setFinalScore(completedRounds);
      setGameState('gameOver');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, timeLeft, completedRounds]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerActive(false);
    setTimeLeft(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    setTimeLeft(5);
    setTimerStartTime(startTime);
    setIsTimerActive(true);
  }, []);

  const startGame = useCallback(() => {
    const newSequence = generateRandomSequence(5);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(1);
    setCompletedRounds(0);
    setFinalScore(0);
    stopTimer();
    setGameState('displaying');
  }, [stopTimer]);

  const nextRound = useCallback(() => {
    const newSequence = generateRandomSequence(5);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(prev => prev + 1);
    stopTimer();
    setGameState('displaying');
  }, [stopTimer]);

  const nextNumber = useCallback(() => {
    setCurrentNumberIndex(prev => prev + 1);
  }, []);

  const finishSequence = useCallback(() => {
    setGameState('input');
    startTimer();
  }, [startTimer]);

  const submitAnswer = useCallback(() => {
    stopTimer();
    const userSum = parseInt(userAnswer, 10);
    const correct = userSum === correctSum;
    setIsCorrect(correct);
    
    if (correct) {
      setCompletedRounds(prev => prev + 1);
      setGameState('result');
    } else {
      setFinalScore(completedRounds);
      setGameState('gameOver');
    }
  }, [userAnswer, correctSum, completedRounds, stopTimer]);

  const resetGame = useCallback(() => {
    stopTimer();
    setGameState('idle');
    setSequence([]);
    setCurrentNumberIndex(-1);
    setCorrectSum(0);
    setUserAnswer('');
    setIsCorrect(null);
    setCurrentRound(0);
    setCompletedRounds(0);
    setFinalScore(0);
  }, [stopTimer]);

  return {
    gameState,
    sequence,
    currentNumberIndex,
    correctSum,
    userAnswer,
    setUserAnswer,
    isCorrect,
    currentRound,
    completedRounds,
    finalScore,
    timeLeft,
    isTimerActive,
    timerStartTime,
    startGame,
    nextNumber,
    finishSequence,
    submitAnswer,
    nextRound,
    resetGame
  };
};