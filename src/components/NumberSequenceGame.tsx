'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSession } from '@/hooks/useSession';
import { GameSession } from '@/lib/session';
import { api } from '@/lib/api';
import { SequenceDisplay } from './SequenceDisplay';
import { GameControls } from './GameControls';
import { HelpButton } from './HelpButton';
import { AppLayout } from './AppLayout';
import { useCoins } from '@/hooks/useCoins';

interface NumberSequenceGameProps {
  session: GameSession;
}

export const NumberSequenceGame = ({ session }: NumberSequenceGameProps) => {
  const router = useRouter();
  const { endSession } = useSession();
  const { addCoins } = useCoins();
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(true);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const hasProcessedScoreRef = useRef<boolean>(false);
  const lastProcessedScoreRef = useRef<number>(-1);

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
    difficulty,
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

  // Save high score when game ends - optimized to run only once per game session
  useEffect(() => {
    if (
      gameState === 'gameOver' && 
      finalScore > 0 && 
      !hasProcessedScoreRef.current && 
      !isSavingScore &&
      finalScore > highScore &&
      lastProcessedScoreRef.current !== finalScore
    ) {
      // Mark as processed immediately to prevent duplicates
      hasProcessedScoreRef.current = true;
      lastProcessedScoreRef.current = finalScore;
      setIsSavingScore(true);
      
      const saveScore = async () => {
        try {
          const response = await api.saveHighScore(session.playerId, finalScore);
          
          if (response.isNewRecord) {
            setHighScore(response.highScore);
          }

          // Reward coins based on performance
          const baseReward = finalScore * 10; // 10 coins per round completed
          const bonusReward = response.isNewRecord ? 50 : 0; // Bonus for new record
          const totalReward = baseReward + bonusReward;
          
          if (totalReward > 0) {
            addCoins(totalReward);
            console.log(`Awarded ${totalReward} coins (${baseReward} base + ${bonusReward} bonus)`);
          }
        } catch (error) {
          console.error('Failed to save high score:', error);
          // Reset the flags on error so user can retry
          hasProcessedScoreRef.current = false;
          lastProcessedScoreRef.current = -1;
        } finally {
          setIsSavingScore(false);
        }
      };

      saveScore();
    }
  // Remove highScore from dependencies to prevent re-triggering when high score updates
  }, [gameState, finalScore, session.playerId, addCoins, isSavingScore, highScore]);

  // Wrapper functions to reset the score processing flag
  const handleStartGame = () => {
    hasProcessedScoreRef.current = false; // Reset flag for new game
    lastProcessedScoreRef.current = -1; // Reset last processed score
    setIsSavingScore(false); // Reset saving state
    startGame();
  };

  const handleResetGame = () => {
    hasProcessedScoreRef.current = false; // Reset flag for new game
    lastProcessedScoreRef.current = -1; // Reset last processed score
    setIsSavingScore(false); // Reset saving state
    resetGame();
  };

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
    <AppLayout showNavBar={false}>
      <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
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
          displayInterval={difficulty.displayInterval}
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
          difficulty={difficulty}
          onStart={handleStartGame}
          onSubmit={submitAnswer}
          onNextRound={nextRound}
          onReset={handleResetGame}
          onBackToMenu={handleBackToMenu}
        />
      </div>

        {/* Floating Help Button */}
        <HelpButton />
      </div>
    </AppLayout>
  );
};