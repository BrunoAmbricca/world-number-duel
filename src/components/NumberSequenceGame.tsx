'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSession } from '@/hooks/useSession';
import { GameSession } from '@/lib/session';
import { api } from '@/lib/api';
import { SequenceDisplay } from './SequenceDisplay';
import { GameControls } from './GameControls';
import { HelpButton } from './HelpButton';

interface NumberSequenceGameProps {
  session: GameSession;
}

export const NumberSequenceGame = ({ session }: NumberSequenceGameProps) => {
  const router = useRouter();
  const { endSession } = useSession();
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(true);

  const {
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
  } = useGameLogic();

  // Load high score on component mount
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const response = await api.getHighScore(session.playerId);
        setHighScore(response.highScore || 0);
      } catch (error) {
        console.error('Failed to load high score:', error);
      } finally {
        setIsLoadingScore(false);
      }
    };

    loadHighScore();
  }, [session.playerId]);

  // Save high score when game ends
  useEffect(() => {
    if (gameState === 'gameOver' && finalScore > 0) {
      const saveScore = async () => {
        try {
          const response = await api.saveHighScore(session.playerId, finalScore);
          if (response.isNewRecord) {
            setHighScore(finalScore);
          }
        } catch (error) {
          console.error('Failed to save high score:', error);
        }
      };

      saveScore();
    }
  }, [gameState, finalScore, session.playerId]);

  const handleEndSession = () => {
    endSession();
    router.push('/');
  };

  const handleBackToMenu = () => {
    handleEndSession();
  };

  if (isLoadingScore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="text-base font-semibold text-gray-700">
          <span className="text-blue-600">{session.playerId}</span>
          {highScore > 0 && (
            <div className="text-sm text-gray-500">
              Best: {highScore}
            </div>
          )}
        </div>
        <button
          onClick={handleEndSession}
          className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Top Section - Sequence Display and Timer */}
      <div className="flex-1 flex flex-col">
        <SequenceDisplay
          sequence={sequence}
          currentIndex={currentNumberIndex}
          isDisplaying={gameState === 'displaying'}
          onNext={nextNumber}
          onFinish={finishSequence}
          timeLeft={timeLeft}
          isTimerActive={isTimerActive}
          timerStartTime={timerStartTime}
        />
        
        {/* Middle and Bottom Section - Game Controls */}
        <GameControls
          gameState={gameState}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          correctSum={correctSum}
          isCorrect={isCorrect}
          currentRound={currentRound}
          completedRounds={completedRounds}
          finalScore={finalScore}
          highScore={highScore}
          timeLeft={timeLeft}
          isTimerActive={isTimerActive}
          timerStartTime={timerStartTime}
          onStart={startGame}
          onSubmit={submitAnswer}
          onNextRound={nextRound}
          onReset={resetGame}
          onBackToMenu={handleBackToMenu}
        />
      </div>

      {/* Floating Help Button */}
      <HelpButton />
    </div>
  );
};