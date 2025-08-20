'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { usePusher } from '@/hooks/usePusher';
import { SequenceDisplay } from './SequenceDisplay';
import { GameControls } from './GameControls';

interface MultiplayerNumberSequenceGameProps {
  matchId: string;
}

type MultiplayerGameState = 'idle' | 'displaying' | 'input' | 'result' | 'waiting';

export default function MultiplayerNumberSequenceGame({ matchId }: MultiplayerNumberSequenceGameProps) {
  const { session } = useSession();
  const router = useRouter();
  usePusher(); // Initialize Pusher connection

  const {
    match,
    currentRound,
    isLoading,
    error,
    isGameActive,
    submitAnswer: submitMultiplayerAnswer,
    loadMatch,
  } = useMultiplayerGame(matchId, session?.playerId || '');

  // Local game state for sequence display
  const [gameState, setGameState] = useState<MultiplayerGameState>('idle');
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(-1);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer functions (defined first to avoid initialization issues)
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

  // Timer countdown effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, timeLeft]);

  // Timer expiration effect
  useEffect(() => {
    if (isTimerActive && timeLeft === 0 && !hasSubmitted && currentRound) {
      console.log('⏰ Timer expired, auto-submitting incorrect answer');
      setIsTimerActive(false);
      // Set empty answer and submit
      setUserAnswer('');
      // Trigger submit by calling the async function directly
      (async () => {
        stopTimer();
        const userSum = -999999; // Invalid sum for timeout
        setIsCorrect(false);
        setHasSubmitted(true);
        setGameState('waiting');
        try {
          await submitMultiplayerAnswer(userSum);
        } catch (error) {
          console.error('Failed to submit answer:', error);
          setGameState('input');
          setHasSubmitted(false);
        }
      })();
    }
  }, [isTimerActive, timeLeft, hasSubmitted, currentRound, stopTimer, submitMultiplayerAnswer]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('🎮 MultiplayerGame state update:', {
      match_status: match?.status,
      match_winner: match?.winner_id,
      current_round: match?.current_round,
      isGameActive,
      gameState,
      hasSubmitted
    });
  }, [match?.status, match?.winner_id, match?.current_round, isGameActive, gameState, hasSubmitted]);

  // Start new round when currentRound changes
  useEffect(() => {
    if (currentRound && currentRound.sequence) {
      console.log('🎮 Starting new round with sequence:', currentRound.sequence);
      console.log('🔢 Round details:', {
        round_number: currentRound.round_number,
        correct_sum: currentRound.correct_sum,
        sequence: currentRound.sequence
      });
      setCurrentNumberIndex(-1);
      setUserAnswer('');
      setIsCorrect(null);
      setHasSubmitted(false);
      stopTimer();
      setGameState('displaying');
    }
  }, [currentRound?.id, currentRound?.round_number, stopTimer]); // Use round ID and number as dependencies

  // Handle match completion - redirect to result page
  useEffect(() => {
    if (match?.status === 'completed') {
      console.log('🏁 Match completed, redirecting to result page...');
      console.log('🏆 Winner:', match.winner_id, 'Current player:', session?.playerId);
      
      // Small delay to ensure the user sees the final game state briefly
      setTimeout(() => {
        router.push(`/game/${matchId}/result`);
      }, 2000);
    }
  }, [match?.status, matchId, router, session?.playerId]);

  // Auto-start first round
  useEffect(() => {
    if (currentRound && !isLoading && gameState === 'idle') {
      setGameState('displaying');
    }
  }, [currentRound, isLoading, gameState]);

  const nextNumber = useCallback(() => {
    setCurrentNumberIndex(prev => prev + 1);
  }, []);

  const finishSequence = useCallback(() => {
    setGameState('input');
    startTimer();
  }, [startTimer]);

  const submitAnswer = useCallback(async () => {
    if (!currentRound || !session || hasSubmitted) return;

    stopTimer();
    // If userAnswer is empty (timer expired), treat as incorrect
    const userSum = userAnswer.trim() ? parseInt(userAnswer, 10) : -999999; // Use invalid sum for timeout
    setIsCorrect(userSum === currentRound.correct_sum);
    setHasSubmitted(true);
    setGameState('waiting');

    try {
      await submitMultiplayerAnswer(userSum);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setGameState('input');
      setHasSubmitted(false);
    }
  }, [userAnswer, currentRound, session, hasSubmitted, submitMultiplayerAnswer, stopTimer]);

  const resetForNextRound = useCallback(() => {
    setGameState('idle');
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please start a session to play
          </h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/queue')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (!match || !currentRound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Waiting for match data...</p>
        </div>
      </div>
    );
  }

  const getStatusMessage = () => {
    console.log('🔍 getStatusMessage called with:', {
      isGameActive,
      match_status: match?.status,
      match_winner: match?.winner_id,
      session_playerId: session?.playerId
    });

    if (!isGameActive) {
      if (match?.status === 'completed') {
        if (match.winner_id === session?.playerId) {
          return { text: 'You won! 🎉 Redirecting...', color: 'text-green-600' };
        } else if (match.winner_id) {
          return { text: 'You lost 😞 Redirecting...', color: 'text-red-600' };
        } else {
          return { text: 'Match ended - Redirecting...', color: 'text-gray-600' };
        }
      }
      return { text: 'Match not active', color: 'text-gray-600' };
    }

    if (gameState === 'displaying') {
      return { text: 'Watch the sequence...', color: 'text-blue-600' };
    } else if (gameState === 'input') {
      return { text: 'Calculate the sum!', color: 'text-green-600' };
    } else if (gameState === 'waiting') {
      return { text: 'Waiting for opponent...', color: 'text-orange-600' };
    }

    return { text: 'Ready to play!', color: 'text-gray-600' };
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-semibold text-gray-700">
            Playing as: <span className="text-blue-600">{session.playerId}</span>
          </div>
          <button
            onClick={() => router.push('/queue')}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
          >
            Leave Game
          </button>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`text-center p-4 rounded-lg ${match.player1_id === session.playerId ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <p className="font-semibold">{match.player1_id === session.playerId ? session.playerId : match.player1_id}</p>
            <p className="text-sm text-gray-600">
              {match.player1_id === session.playerId ? '(You)' : '(Opponent)'}
            </p>
          </div>
          <div className={`text-center p-4 rounded-lg ${match.player2_id === session.playerId ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <p className="font-semibold">{match.player2_id === session.playerId ? session.playerId : match.player2_id}</p>
            <p className="text-sm text-gray-600">
              {match.player2_id === session.playerId ? '(You)' : '(Opponent)'}
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className={`text-lg font-semibold ${status.color}`}>
            {status.text}
          </p>
          <p className="text-sm text-gray-600">
            Round {match.current_round}
          </p>
        </div>

        {/* Sequence Display - Same as single-player */}
        <SequenceDisplay
          sequence={currentRound.sequence}
          currentIndex={currentNumberIndex}
          isDisplaying={gameState === 'displaying'}
          onNext={nextNumber}
          onFinish={finishSequence}
        />
        
        {/* Game Controls - Same as single-player */}
        <GameControls
          gameState={gameState as any} // Cast for compatibility with single-player GameState
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          correctSum={currentRound.correct_sum}
          isCorrect={isCorrect}
          currentRound={match.current_round}
          completedRounds={0} // Not used in multiplayer
          finalScore={0} // Not used in multiplayer
          highScore={0} // Not used in multiplayer
          timeLeft={timeLeft}
          isTimerActive={isTimerActive}
          timerStartTime={timerStartTime}
          onStart={() => {}} // No manual start in multiplayer
          onSubmit={submitAnswer}
          onNextRound={() => {}} // Not used in multiplayer
          onReset={resetForNextRound}
          onBackToMenu={() => router.push('/queue')}
          disabled={hasSubmitted || gameState === 'waiting'}
        />

        {/* Multiplayer specific status */}
        {gameState === 'waiting' && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-600">
                {hasSubmitted ? 'Waiting for opponent to submit...' : 'Submitting answer...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}