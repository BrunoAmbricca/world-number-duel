'use client';

import { useRouter } from 'next/navigation';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSession } from '@/hooks/useSession';
import { GameSession } from '@/lib/session';
import { SequenceDisplay } from './SequenceDisplay';
import { GameControls } from './GameControls';

interface NumberSequenceGameProps {
  session: GameSession;
}

export const NumberSequenceGame = ({ session }: NumberSequenceGameProps) => {
  const router = useRouter();
  const { endSession } = useSession();
  const {
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
  } = useGameLogic();

  const handleEndSession = () => {
    endSession();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-semibold text-gray-700">
            Playing as: <span className="text-blue-600">{session.playerId}</span>
          </div>
          <button
            onClick={handleEndSession}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
          >
            End Session
          </button>
        </div>

        <SequenceDisplay
          sequence={sequence}
          currentIndex={currentNumberIndex}
          isDisplaying={gameState === 'displaying'}
          onNext={nextNumber}
          onFinish={finishSequence}
        />
        
        <GameControls
          gameState={gameState}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          correctSum={correctSum}
          isCorrect={isCorrect}
          onStart={startGame}
          onSubmit={submitAnswer}
          onReset={resetGame}
        />
      </div>
    </div>
  );
};