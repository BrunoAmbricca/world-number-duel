"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { generateRandomSequence, calculateSum } from "@/utils/gameHelpers";

export type GameState = "idle" | "displaying" | "input" | "result" | "gameOver";

interface DifficultySettings {
  sequenceLength: number;
  displayInterval: number; // in milliseconds
  lastDifficultyType: "sequence" | "timing" | null;
}

const calculateDifficulty = (completedRounds: number): DifficultySettings => {
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
      lastDifficultyType: null,
    };
  }

  let sequenceLength = baseSequenceLength;
  let displayInterval = baseInterval;
  let lastDifficultyType: "sequence" | "timing" | null = null;

  // Apply difficulty increases alternately, but only sequence after min interval
  for (let i = 0; i < difficultyIncrements; i++) {
    const canDecreaseTiming = displayInterval > minInterval;
    const shouldIncreaseSequence = i % 2 === 0 || !canDecreaseTiming;

    if (shouldIncreaseSequence) {
      sequenceLength += 1;
      lastDifficultyType = "sequence";
    } else {
      displayInterval = Math.max(minInterval, displayInterval - 100); // Decrease by 0.1s
      lastDifficultyType = "timing";
    }
  }

  return {
    sequenceLength,
    displayInterval,
    lastDifficultyType,
  };
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(-1);
  const [correctSum, setCorrectSum] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<DifficultySettings>({
    sequenceLength: 5,
    displayInterval: 1000,
    lastDifficultyType: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerActive && timeLeft === 0 && gameState !== "gameOver") {
      // Timer expired - auto game over (only if not already game over)
      setIsTimerActive(false);
      setFinalScore(completedRounds);
      setGameState("gameOver");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, timeLeft, completedRounds, gameState]);

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
    // Reset difficulty for new game
    const initialDifficulty = calculateDifficulty(0);
    setDifficulty(initialDifficulty);

    const newSequence = generateRandomSequence(
      initialDifficulty.sequenceLength
    );
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer("");
    setIsCorrect(null);
    setCurrentRound(1);
    setCompletedRounds(0);
    setFinalScore(0);
    stopTimer();
    setGameState("displaying");
  }, [stopTimer]);

  const nextRound = useCallback(() => {
    // Calculate new difficulty based on completed rounds
    const newDifficulty = calculateDifficulty(completedRounds);
    setDifficulty(newDifficulty);

    const newSequence = generateRandomSequence(newDifficulty.sequenceLength);
    setSequence(newSequence);
    setCorrectSum(calculateSum(newSequence));
    setCurrentNumberIndex(-1);
    setUserAnswer("");
    setIsCorrect(null);
    setCurrentRound((prev) => prev + 1);
    stopTimer();
    setGameState("displaying");
  }, [stopTimer, completedRounds]);

  const nextNumber = useCallback(() => {
    setCurrentNumberIndex((prev) => prev + 1);
  }, []);

  const finishSequence = useCallback(() => {
    setGameState("input");
    startTimer();
  }, [startTimer]);

  const submitAnswer = useCallback(() => {
    stopTimer();
    const userSum = parseInt(userAnswer, 10);
    const correct = userSum === correctSum;
    setIsCorrect(correct);

    if (correct) {
      setCompletedRounds((prev) => prev + 1);
      setGameState("result");
    } else {
      setFinalScore(completedRounds);
      setGameState("gameOver");
    }
  }, [userAnswer, correctSum, completedRounds, stopTimer]);

  const resetGame = useCallback(() => {
    stopTimer();
    setGameState("idle");
    setSequence([]);
    setCurrentNumberIndex(-1);
    setCorrectSum(0);
    setUserAnswer("");
    setIsCorrect(null);
    setCurrentRound(0);
    setCompletedRounds(0);
    setFinalScore(0);
    setDifficulty({
      sequenceLength: 5,
      displayInterval: 1000,
      lastDifficultyType: null,
    });
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
    difficulty,
    startGame,
    nextNumber,
    finishSequence,
    submitAnswer,
    nextRound,
    resetGame,
  };
};
